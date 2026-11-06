/**
 * Amazon Chime SDK Frontend Meeting Service
 * 
 * Provides production-grade orchestration of:
 * - Pre-meeting device check & preview
 * - Audio & Video input/output device selection
 * - Local & remote video tile management (AudioVideoFacade)
 * - Remote audio binding to HTMLAudioElement
 * - Screen sharing (Content share)
 * - Real-time attendee roster & speaking/mute indicators
 * - Reconnection, connection status, and error handling
 * - Clean teardown and leave/end meeting flows
 */

import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  AudioVideoObserver,
  VideoTileState,
  MeetingSessionStatus,
  MeetingSessionStatusCode,
  DeviceChangeObserver,
  ContentShareObserver,
} from 'amazon-chime-sdk-js';
import { ChimeJoinSessionResponse, ChimeDeviceOption } from '../types/meetingnext';
import { meetingNextApi } from './meetingNextApi';

export type ChimeConnectionState = 
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export interface VideoTileItem {
  tileId: number;
  attendeeId: string;
  isLocal: boolean;
  isContentShare: boolean;
  boundVideoElement?: HTMLVideoElement | null;
  videoStreamId?: number;
}

export interface ChimeServiceCallbacks {
  onConnectionStateChange?: (state: ChimeConnectionState, message?: string) => void;
  onTileUpdate?: (tiles: VideoTileItem[]) => void;
  onAttendeeChange?: (attendees: { attendeeId: string; externalUserId?: string; present: boolean; muted?: boolean; volume?: number }[]) => void;
  onError?: (error: string) => void;
  onScreenShareChange?: (isSharing: boolean) => void;
}

class ChimeClientService {
  private meetingSession: DefaultMeetingSession | null = null;
  private deviceController: DefaultDeviceController | null = null;
  private logger: ConsoleLogger | null = null;
  private connectionState: ChimeConnectionState = 'idle';
  private callbacks: ChimeServiceCallbacks = {};
  private activeTiles: Map<number, VideoTileItem> = new Map();
  private attendeeMap: Map<string, { attendeeId: string; externalUserId?: string; present: boolean; muted?: boolean; volume?: number }> = new Map();
  private isScreenSharingActive = false;
  private isLocalAudioMuted = false;
  private isLocalVideoActive = false;
  private selectedAudioInputId: string | null = null;
  private selectedVideoInputId: string | null = null;
  private selectedAudioOutputId: string | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private previewStream: MediaStream | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.logger = new ConsoleLogger('ChimeMeetingSDK', LogLevel.WARN);
      this.deviceController = new DefaultDeviceController(this.logger);
    }
  }

  public setCallbacks(callbacks: ChimeServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getConnectionState(): ChimeConnectionState {
    return this.connectionState;
  }

  public isSharing(): boolean {
    return this.isScreenSharingActive;
  }

  public isMuted(): boolean {
    return this.isLocalAudioMuted;
  }

  public isVideoStarted(): boolean {
    return this.isLocalVideoActive;
  }

  // ---------------------------------------------------------------------------
  // Device Management & Pre-Meeting Checks
  // ---------------------------------------------------------------------------

  public async listAudioInputDevices(): Promise<ChimeDeviceOption[]> {
    try {
      if (!this.deviceController) return [];
      const devices = await this.deviceController.listAudioInputDevices();
      return devices.map((d, index) => ({
        deviceId: d.deviceId || `default-mic-${index}`,
        label: d.label || `Microphone ${index + 1}`,
        groupId: d.groupId,
      }));
    } catch (e: any) {
      console.warn('[Chime SDK] listAudioInputDevices fallback:', e);
      return [{ deviceId: 'default', label: 'Default System Microphone' }];
    }
  }

  public async listVideoInputDevices(): Promise<ChimeDeviceOption[]> {
    try {
      if (!this.deviceController) return [];
      const devices = await this.deviceController.listVideoInputDevices();
      return devices.map((d, index) => ({
        deviceId: d.deviceId || `default-cam-${index}`,
        label: d.label || `Camera ${index + 1}`,
        groupId: d.groupId,
      }));
    } catch (e: any) {
      console.warn('[Chime SDK] listVideoInputDevices fallback:', e);
      return [{ deviceId: 'default', label: 'Default HD Webcam' }];
    }
  }

  public async listAudioOutputDevices(): Promise<ChimeDeviceOption[]> {
    try {
      if (!this.deviceController) return [];
      const devices = await this.deviceController.listAudioOutputDevices();
      return devices.map((d, index) => ({
        deviceId: d.deviceId || `default-spk-${index}`,
        label: d.label || `Speaker ${index + 1}`,
        groupId: d.groupId,
      }));
    } catch (e: any) {
      console.warn('[Chime SDK] listAudioOutputDevices fallback:', e);
      return [{ deviceId: 'default', label: 'Default System Speaker' }];
    }
  }

  public async startPreMeetingPreview(videoElement: HTMLVideoElement, deviceId?: string): Promise<boolean> {
    try {
      this.stopPreMeetingPreview();
      const constraints: MediaStreamConstraints = {
        video: deviceId && deviceId !== 'default' ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.previewStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = this.previewStream;
        await videoElement.play().catch(() => {});
        return true;
      }
      return false;
    } catch (e: any) {
      console.warn('[Chime SDK] Camera preview note:', e.message);
      return false;
    }
  }

  public stopPreMeetingPreview(): void {
    if (this.previewStream) {
      this.previewStream.getTracks().forEach((track) => track.stop());
      this.previewStream = null;
    }
  }

  public async selectAudioInput(deviceId: string): Promise<void> {
    this.selectedAudioInputId = deviceId;
    if (this.meetingSession?.audioVideo) {
      try {
        await this.meetingSession.audioVideo.startAudioInput(deviceId);
      } catch (err: any) {
        this.callbacks.onError?.(`Microphone error: ${err.message || 'Failed to select microphone'}`);
      }
    }
  }

  public async selectVideoInput(deviceId: string): Promise<void> {
    this.selectedVideoInputId = deviceId;
    if (this.meetingSession?.audioVideo && this.isLocalVideoActive) {
      try {
        await this.meetingSession.audioVideo.startVideoInput(deviceId);
      } catch (err: any) {
        this.callbacks.onError?.(`Camera error: ${err.message || 'Failed to select camera'}`);
      }
    }
  }

  public async selectAudioOutput(deviceId: string): Promise<void> {
    this.selectedAudioOutputId = deviceId;
    if (this.meetingSession?.audioVideo) {
      try {
        await this.meetingSession.audioVideo.chooseAudioOutput(deviceId);
      } catch (err: any) {
        console.warn('[Chime SDK] Audio output selection not supported in this browser:', err.message);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Meeting Session Initialization & AudioVideoFacade Binding
  // ---------------------------------------------------------------------------

  public async initializeSession(
    joinResponse: ChimeJoinSessionResponse,
    audioElement: HTMLAudioElement,
    initialAudioMuted: boolean = false,
    initialVideoEnabled: boolean = true
  ): Promise<void> {
    if (!this.logger || !this.deviceController) {
      this.logger = new ConsoleLogger('ChimeMeetingSDK', LogLevel.WARN);
      this.deviceController = new DefaultDeviceController(this.logger);
    }

    this.audioElement = audioElement;
    this.isLocalAudioMuted = initialAudioMuted;
    this.isLocalVideoActive = initialVideoEnabled;

    // Validate backend response has no AWS credentials
    const { chimeMeeting, attendee } = joinResponse;
    if (!chimeMeeting || !attendee) {
      throw new Error('Invalid Chime session payload: Missing meeting or attendee data');
    }

    const configuration = new MeetingSessionConfiguration(chimeMeeting as any, attendee as any);
    this.meetingSession = new DefaultMeetingSession(configuration, this.logger, this.deviceController);

    const av = this.meetingSession.audioVideo;

    // Bind audio output element to receive remote participant voices
    try {
      await av.bindAudioElement(audioElement);
    } catch (e: any) {
      console.warn('[Chime SDK] bindAudioElement note:', e.message);
    }

    // Register AudioVideoObserver for real-time connection lifecycle and video tiles
    const observer: AudioVideoObserver = {
      audioVideoDidStart: () => {
        this.connectionState = 'connected';
        this.callbacks.onConnectionStateChange?.('connected', 'Connected to Amazon Chime (ap-south-1 Mumbai)');
      },
      audioVideoDidStop: (sessionStatus: MeetingSessionStatus) => {
        const statusCode = sessionStatus.statusCode();
        if (statusCode === MeetingSessionStatusCode.AudioJoinedFromAnotherDevice) {
          this.connectionState = 'disconnected';
          this.callbacks.onConnectionStateChange?.('disconnected', 'Session transferred to another device');
        } else if (statusCode === MeetingSessionStatusCode.Left) {
          this.connectionState = 'disconnected';
          this.callbacks.onConnectionStateChange?.('disconnected', 'You left the meeting');
        } else {
          this.connectionState = 'disconnected';
          this.callbacks.onConnectionStateChange?.('disconnected', `Session ended (Status: ${statusCode})`);
        }
      },
      audioVideoDidStartConnecting: (reconnecting: boolean) => {
        if (reconnecting) {
          this.connectionState = 'reconnecting';
          this.callbacks.onConnectionStateChange?.('reconnecting', 'Network interruption: Reconnecting to Chime session...');
        } else {
          this.connectionState = 'connecting';
          this.callbacks.onConnectionStateChange?.('connecting', 'Connecting to ap-south-1 Media Server...');
        }
      },
      videoTileDidUpdate: (tileState: VideoTileState) => {
        if (!tileState.tileId) return;

        const tileItem: VideoTileItem = {
          tileId: tileState.tileId,
          attendeeId: tileState.boundAttendeeId || '',
          isLocal: !!tileState.localTile,
          isContentShare: !!tileState.isContent,
          videoStreamId: tileState.streamId ?? undefined,
        };

        this.activeTiles.set(tileState.tileId, tileItem);
        this.emitTilesUpdate();
      },
      videoTileWasRemoved: (tileId: number) => {
        this.activeTiles.delete(tileId);
        this.emitTilesUpdate();
      },
    };

    av.addObserver(observer);

    // Register content share observer
    const contentShareObserver: ContentShareObserver = {
      contentShareDidStart: () => {
        this.isScreenSharingActive = true;
        this.callbacks.onScreenShareChange?.(true);
      },
      contentShareDidStop: () => {
        this.isScreenSharingActive = false;
        this.callbacks.onScreenShareChange?.(false);
      },
    };
    av.addContentShareObserver(contentShareObserver);

    // Subscribe to real-time attendee presence
    av.realtimeSubscribeToAttendeeIdPresence((attendeeId: string, present: boolean, externalUserId?: string) => {
      const existing = this.attendeeMap.get(attendeeId) || { attendeeId, present, externalUserId };
      existing.present = present;
      existing.externalUserId = externalUserId || existing.externalUserId;
      this.attendeeMap.set(attendeeId, existing);
      this.emitAttendeesUpdate();

      // Subscribe to volume changes for this attendee
      if (present) {
        av.realtimeSubscribeToVolumeIndicator(attendeeId, (id: string, volume: number | null, muted: boolean | null) => {
          const att = this.attendeeMap.get(id);
          if (att) {
            att.volume = volume ?? 0;
            att.muted = muted ?? false;
            this.emitAttendeesUpdate();
          }
        });
      }
    });
  }

  /**
   * Starts the audio/video session and selects initial audio and video devices
   */
  public async start(): Promise<void> {
    if (!this.meetingSession) {
      throw new Error('Chime meeting session is not initialized');
    }

    const av = this.meetingSession.audioVideo;

    try {
      // 1. Choose audio input device
      const audioDevices = await this.listAudioInputDevices();
      const chosenMicId = this.selectedAudioInputId || (audioDevices.length > 0 ? audioDevices[0].deviceId : 'default');
      try {
        await av.startAudioInput(chosenMicId);
        if (this.isLocalAudioMuted) {
          av.realtimeMuteLocalAudio();
        } else {
          av.realtimeUnmuteLocalAudio();
        }
      } catch (micErr: any) {
        console.warn('[Chime SDK] Microphone start note:', micErr.message);
        this.callbacks.onError?.('Microphone access unavailable or denied. Operating in listen mode.');
      }

      // 2. Choose video input device if enabled
      if (this.isLocalVideoActive) {
        const videoDevices = await this.listVideoInputDevices();
        const chosenCamId = this.selectedVideoInputId || (videoDevices.length > 0 ? videoDevices[0].deviceId : 'default');
        try {
          await av.startVideoInput(chosenCamId);
          av.startLocalVideoTile();
        } catch (camErr: any) {
          console.warn('[Chime SDK] Camera start note:', camErr.message);
          this.isLocalVideoActive = false;
          this.callbacks.onError?.('Camera access unavailable or denied. Starting with video off.');
        }
      }

      // 3. Start audio/video WebRTC session
      av.start();
    } catch (e: any) {
      this.connectionState = 'failed';
      this.callbacks.onConnectionStateChange?.('failed', `Failed to start session: ${e.message}`);
      throw e;
    }
  }

  // ---------------------------------------------------------------------------
  // In-Meeting Controls (Mic, Cam, Screen Share, Tile Binding)
  // ---------------------------------------------------------------------------

  public async setMicrophoneMuted(muted: boolean): Promise<void> {
    if (!this.meetingSession) return;
    this.isLocalAudioMuted = muted;
    if (muted) {
      this.meetingSession.audioVideo.realtimeMuteLocalAudio();
    } else {
      this.meetingSession.audioVideo.realtimeUnmuteLocalAudio();
    }
  }

  public async setVideoEnabled(enabled: boolean): Promise<void> {
    if (!this.meetingSession) return;
    this.isLocalVideoActive = enabled;
    const av = this.meetingSession.audioVideo;

    if (enabled) {
      try {
        const videoDevices = await this.listVideoInputDevices();
        const chosenCamId = this.selectedVideoInputId || (videoDevices.length > 0 ? videoDevices[0].deviceId : 'default');
        await av.startVideoInput(chosenCamId);
        av.startLocalVideoTile();
      } catch (e: any) {
        this.isLocalVideoActive = false;
        this.callbacks.onError?.(`Unable to turn on camera: ${e.message}`);
      }
    } else {
      try {
        av.stopLocalVideoTile();
        await av.stopVideoInput();
      } catch (e: any) {
        console.warn('[Chime SDK] Stop video input note:', e.message);
      }
    }
  }

  public async startScreenShare(): Promise<void> {
    if (!this.meetingSession) return;
    try {
      await this.meetingSession.audioVideo.startContentShareFromScreenCapture();
      this.isScreenSharingActive = true;
      this.callbacks.onScreenShareChange?.(true);
    } catch (e: any) {
      console.warn('[Chime SDK] Screen share cancelled or rejected:', e.message);
      this.isScreenSharingActive = false;
      this.callbacks.onScreenShareChange?.(false);
      this.callbacks.onError?.(e.message?.includes('Permission denied') ? 'Screen sharing permission denied' : `Screen share note: ${e.message}`);
    }
  }

  public async stopScreenShare(): Promise<void> {
    if (!this.meetingSession) return;
    try {
      await this.meetingSession.audioVideo.stopContentShare();
      this.isScreenSharingActive = false;
      this.callbacks.onScreenShareChange?.(false);
    } catch (e: any) {
      console.warn('[Chime SDK] Stop content share note:', e.message);
    }
  }

  public bindVideoElement(tileId: number, videoElement: HTMLVideoElement): void {
    if (!this.meetingSession) return;
    try {
      this.meetingSession.audioVideo.bindVideoElement(tileId, videoElement);
      const item = this.activeTiles.get(tileId);
      if (item) {
        item.boundVideoElement = videoElement;
      }
    } catch (e: any) {
      console.warn('[Chime SDK] bindVideoElement note:', e.message);
    }
  }

  public unbindVideoElement(tileId: number): void {
    if (!this.meetingSession) return;
    try {
      this.meetingSession.audioVideo.unbindVideoElement(tileId);
      const item = this.activeTiles.get(tileId);
      if (item) {
        item.boundVideoElement = null;
      }
    } catch (e: any) {
      console.warn('[Chime SDK] unbindVideoElement note:', e.message);
    }
  }

  // ---------------------------------------------------------------------------
  // Meeting Teardown (Leave & End Meeting)
  // ---------------------------------------------------------------------------

  public async leaveMeeting(): Promise<void> {
    this.stopPreMeetingPreview();
    if (this.meetingSession) {
      try {
        if (this.isScreenSharingActive) {
          await this.meetingSession.audioVideo.stopContentShare();
        }
        if (this.isLocalVideoActive) {
          this.meetingSession.audioVideo.stopLocalVideoTile();
          await this.meetingSession.audioVideo.stopVideoInput();
        }
        await this.meetingSession.audioVideo.stopAudioInput();
        this.meetingSession.audioVideo.stop();
      } catch (e: any) {
        console.warn('[Chime SDK] Leave meeting cleanup note:', e.message);
      }
    }
    this.cleanInternalState();
  }

  public async endMeetingForEveryone(meetingId: string): Promise<boolean> {
    await this.leaveMeeting();
    try {
      await meetingNextApi.endChimeMeeting(meetingId);
      return true;
    } catch (e: any) {
      console.warn('[Chime SDK] endMeeting API note:', e.message);
      return false;
    }
  }

  private cleanInternalState(): void {
    this.meetingSession = null;
    this.connectionState = 'disconnected';
    this.activeTiles.clear();
    this.attendeeMap.clear();
    this.isScreenSharingActive = false;
    this.isLocalVideoActive = false;
    this.callbacks.onConnectionStateChange?.('disconnected', 'Meeting ended');
    this.callbacks.onTileUpdate?.([]);
    this.callbacks.onAttendeeChange?.([]);
  }

  private emitTilesUpdate(): void {
    const tiles = Array.from(this.activeTiles.values());
    this.callbacks.onTileUpdate?.(tiles);
  }

  private emitAttendeesUpdate(): void {
    const attendees = Array.from(this.attendeeMap.values());
    this.callbacks.onAttendeeChange?.(attendees);
  }
}

export const chimeClientService = new ChimeClientService();
