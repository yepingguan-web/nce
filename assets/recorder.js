/**
 * 录音功能模块
 * 使用 MediaRecorder API 录制用户跟读音频
 */

class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.audioBlob = null;
    this.audioUrl = null;
  }

  /**
   * 请求麦克风权限并初始化
   */
  async init() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ 麦克风权限已获取');
      return true;
    } catch (error) {
      console.error('❌ 无法访问麦克风:', error);
      throw new Error('请允许访问麦克风以使用跟读功能');
    }
  }

  /**
   * 开始录音
   */
  async startRecording() {
    if (!this.stream) {
      await this.init();
    }

    this.audioChunks = [];
    
    // 创建 MediaRecorder
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    // 收集音频数据
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    // 录音结束
    this.mediaRecorder.onstop = () => {
      this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioUrl = URL.createObjectURL(this.audioBlob);
      console.log('✅ 录音完成');
    };

    // 开始录音
    this.mediaRecorder.start();
    this.isRecording = true;
    console.log('🎤 开始录音...');
  }

  /**
   * 停止录音
   * @returns {Promise<Blob>} 录音音频 Blob
   */
  async stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        this.isRecording = false;
        console.log('✅ 录音已停止');
        resolve(this.audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 播放录音
   * @returns {Audio} 音频对象
   */
  playRecording() {
    if (!this.audioUrl) {
      console.error('❌ 没有可播放的录音');
      return null;
    }

    const audio = new Audio(this.audioUrl);
    audio.play();
    return audio;
  }

  /**
   * 释放资源
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    console.log('🧹 录音资源已释放');
  }

  /**
   * 获取录音音频 Blob
   */
  getAudioBlob() {
    return this.audioBlob;
  }

  /**
   * 获取录音音频 URL
   */
  getAudioUrl() {
    return this.audioUrl;
  }
}

// 导出
window.AudioRecorder = AudioRecorder;
