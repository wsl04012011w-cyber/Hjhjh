import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export class WebRTCVoiceManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private unsubscribes: Array<() => void> = [];

  /**
   * Initializes local microphone audio stream with echo cancellation and noise suppression
   */
  async getLocalMicrophoneStream(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.error('Failed to get local microphone stream:', err);
      throw err;
    }
  }

  /**
   * Setup caller side: creates offer and listens for answer & receiver ICE candidates
   */
  async setupCaller(
    callId: string,
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionChange?: (state: RTCPeerConnectionState) => void
  ): Promise<void> {
    this.cleanup();
    const localStream = await this.getLocalMicrophoneStream();

    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      this.pc?.addTrack(track, localStream);
    });

    // Handle remote audio stream
    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      onRemoteStream(event.streams[0]);
    };

    if (onConnectionChange) {
      this.pc.onconnectionstatechange = () => {
        if (this.pc) onConnectionChange(this.pc.connectionState);
      };
    }

    // Collect ICE candidates and push to Firestore subcollection
    const callerCandidatesCol = collection(db, 'calls', callId, 'callerCandidates');
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(callerCandidatesCol, event.candidate.toJSON()).catch((e) => {
          console.warn('Error adding caller ICE candidate:', e);
        });
      }
    };

    // Create SDP offer
    const offerDescription = await this.pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });
    await this.pc.setLocalDescription(offerDescription);

    const callDocRef = doc(db, 'calls', callId);
    await updateDoc(callDocRef, {
      offer: {
        type: offerDescription.type,
        sdp: offerDescription.sdp,
      },
    });

    // Listen for answer from receiver
    const unsubDoc = onSnapshot(callDocRef, async (snapshot) => {
      const data = snapshot.data();
      if (!this.pc) return;

      if (!this.pc.currentRemoteDescription && data?.answer) {
        try {
          const answerDescription = new RTCSessionDescription(data.answer);
          await this.pc.setRemoteDescription(answerDescription);
        } catch (err) {
          console.error('Error setting remote description on caller:', err);
        }
      }
    });
    this.unsubscribes.push(unsubDoc);

    // Listen for receiver's ICE candidates
    const receiverCandidatesCol = collection(db, 'calls', callId, 'receiverCandidates');
    const unsubReceiverCandidates = onSnapshot(receiverCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' && this.pc) {
          try {
            const candidate = new RTCIceCandidate(change.doc.data());
            await this.pc.addIceCandidate(candidate);
          } catch (err) {
            console.warn('Error adding receiver ICE candidate on caller:', err);
          }
        }
      });
    });
    this.unsubscribes.push(unsubReceiverCandidates);
  }

  /**
   * Setup receiver side: reads caller offer, creates answer and exchanges ICE candidates
   */
  async setupReceiver(
    callId: string,
    onRemoteStream: (stream: MediaStream) => void,
    onConnectionChange?: (state: RTCPeerConnectionState) => void
  ): Promise<void> {
    this.cleanup();
    const localStream = await this.getLocalMicrophoneStream();

    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();

    localStream.getTracks().forEach((track) => {
      this.pc?.addTrack(track, localStream);
    });

    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      onRemoteStream(event.streams[0]);
    };

    if (onConnectionChange) {
      this.pc.onconnectionstatechange = () => {
        if (this.pc) onConnectionChange(this.pc.connectionState);
      };
    }

    const receiverCandidatesCol = collection(db, 'calls', callId, 'receiverCandidates');
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(receiverCandidatesCol, event.candidate.toJSON()).catch((e) => {
          console.warn('Error adding receiver ICE candidate:', e);
        });
      }
    };

    const callDocRef = doc(db, 'calls', callId);

    // Wait until offer is present if needed
    const callSnap = await getDoc(callDocRef);
    let callData = callSnap.data();

    if (callData?.offer) {
      await this.pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answerDescription = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answerDescription);

      await updateDoc(callDocRef, {
        answer: {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        },
      });
    } else {
      // If offer is still being generated, subscribe and wait for it
      const unsubOffer = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (data?.offer && this.pc && !this.pc.currentRemoteDescription) {
          try {
            await this.pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answerDescription = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answerDescription);

            await updateDoc(callDocRef, {
              answer: {
                type: answerDescription.type,
                sdp: answerDescription.sdp,
              },
            });
            unsubOffer();
          } catch (err) {
            console.error('Error handling offer on receiver:', err);
          }
        }
      });
      this.unsubscribes.push(unsubOffer);
    }

    // Listen for caller's ICE candidates
    const callerCandidatesCol = collection(db, 'calls', callId, 'callerCandidates');
    const unsubCallerCandidates = onSnapshot(callerCandidatesCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added' && this.pc) {
          try {
            const candidate = new RTCIceCandidate(change.doc.data());
            await this.pc.addIceCandidate(candidate);
          } catch (err) {
            console.warn('Error adding caller ICE candidate on receiver:', err);
          }
        }
      });
    });
    this.unsubscribes.push(unsubCallerCandidates);
  }

  /**
   * Sets local microphone mute status
   */
  setMicrophoneMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Clean up tracks, peer connection and firestore listeners
   */
  cleanup(): void {
    this.unsubscribes.forEach((unsub) => {
      try {
        unsub();
      } catch (err) {
        console.warn('Error unsubscribing WebRTC listener:', err);
      }
    });
    this.unsubscribes = [];

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.remoteStream = null;
  }
}

export const webrtcService = new WebRTCVoiceManager();
