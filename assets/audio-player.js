/**
 * 音频播放控制器
 * 封装 HTML5 Audio 元素，支持句子级点读和全文播放
 */

class AudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.sentences = [];
    this.currentIndex = -1;
    this.speed = 1.0;
    this.loopMode = false;
    this._monitorId = null;
    this._onSentenceChange = null;
    this._onEnd = null;
    this._onStateChange = null;
    this._onError = null;
  }

  /**
   * 加载课文音频和句子数据
   * @param {string} mp3Path - MP3 文件路径
   * @param {Array} sentences - 句子数据数组
   */
  load(mp3Path, sentences) {
    this.pause();
    this.sentences = sentences || [];
    this.currentIndex = -1;
    // 逐段 URL 编码（encodeURIComponent 会编码 & 等特殊字符）
    this.audio.src = encodeURIPath(mp3Path);
    this.audio.load();
  }

  /**
   * 安全设置 currentTime，避免 readyState=0 时抛出异常
   * @param {number} time - 目标时间（秒）
   */
  _safeSeek(time) {
    if (this.audio.readyState > 0) {
      this.audio.currentTime = time;
    } else {
      // 如果元数据还未加载，等加载完成后再 seek
      const onReady = () => {
        this.audio.currentTime = time;
        this.audio.removeEventListener('loadedmetadata', onReady);
      };
      this.audio.addEventListener('loadedmetadata', onReady);
    }
  }

  /**
   * 播放指定句子（点读模式：只播当前句，播完停止）
   * @param {number} index - 句子索引
   */
  playSentence(index) {
    if (index < 0 || index >= this.sentences.length) return;
    const sentence = this.sentences[index];
    this.currentIndex = index;
    this._safeSeek(sentence.startTime);
    this._play();
    this._startSingleMonitoring(index);
  }

  /**
   * 全文播放
   */
  playFull() {
    this.currentIndex = 0;
    this._safeSeek(0);
    this._play();
    this._startMonitoring();
  }

  /**
   * 暂停
   */
  pause() {
    this.audio.pause();
    this._stopMonitoring();
    this._notifyState('paused');
  }

  /**
   * 继续播放
   */
  resume() {
    this._play();
    this._startMonitoring();
  }

  /**
   * 设置播放速度
   * @param {number} speed - 播放速度 (0.5 ~ 2.0)
   */
  setSpeed(speed) {
    this.speed = speed;
    this.audio.playbackRate = speed;
  }

  /**
   * 设置循环模式
   * @param {boolean} enabled
   */
  setLoop(enabled) {
    this.loopMode = enabled;
  }

  /**
   * 跳转到指定时间
   * @param {number} seconds
   */
  seekTo(seconds) {
    this._safeSeek(Math.max(0, seconds));
  }

  /**
   * 获取当前播放进度
   * @returns {{index: number, time: number, duration: number}}
   */
  getProgress() {
    return {
      index: this.currentIndex,
      time: this.audio.currentTime,
      duration: this.audio.duration || 0
    };
  }

  /**
   * 是否正在播放
   */
  isPlaying() {
    return !this.audio.paused;
  }

  /**
   * 句子切换回调
   * @param {function} cb - callback(index, sentence)
   */
  onSentenceChange(cb) {
    this._onSentenceChange = cb;
  }

  /**
   * 播放结束回调
   * @param {function} cb
   */
  onEnd(cb) {
    this._onEnd = cb;
  }

  /**
   * 状态变化回调
   * @param {function} cb - callback(state: 'playing'|'paused'|'ended'|'error')
   */
  onStateChange(cb) {
    this._onStateChange = cb;
  }

  /**
   * 播放错误回调
   * @param {function} cb - callback(errorMessage)
   */
  onError(cb) {
    this._onError = cb;
  }

  /**
   * 销毁
   */
  destroy() {
    this.pause();
    this.audio.src = '';
    this.sentences = [];
    this.currentIndex = -1;
    this._onSentenceChange = null;
    this._onEnd = null;
    this._onStateChange = null;
    this._onError = null;
  }

  // ─── 内部方法 ───

  _play() {
    const promise = this.audio.play();
    if (promise) {
      promise.then(() => {
        console.log('✅ 音频开始播放');
        this._notifyState('playing');
      }).catch(err => {
        console.warn('⚠ 音频播放失败:', err.message);
        this._stopMonitoring();
        this._notifyState('error');
        if (this._onError) {
          this._onError(err.message || '播放失败，请检查音频文件是否存在');
        }
      });
    } else {
      // 旧版浏览器不支持 play() 返回 Promise
      this._notifyState('playing');
    }
  }

  // 连续播放模式：自动推进到下一句
  _startMonitoring() {
    this._stopMonitoring();
    this._monitorId = setInterval(() => {
      if (!this.sentences.length || this.currentIndex < 0) return;

      const sentence = this.sentences[this.currentIndex];
      if (!sentence) return;

      // 检查当前句子是否播放完毕
      if (this.audio.currentTime >= sentence.endTime) {
        const nextIndex = this.currentIndex + 1;

        if (nextIndex < this.sentences.length) {
          // 切换到下一句
          this.currentIndex = nextIndex;
          if (this._onSentenceChange) {
            this._onSentenceChange(nextIndex, this.sentences[nextIndex]);
          }
        } else {
          // 播放完毕
          this._stopMonitoring();
          if (this.loopMode) {
            this.playFull();
          } else {
            this._notifyState('ended');
            if (this._onEnd) this._onEnd();
          }
        }
      }
    }, 100);
  }

  // 单句播放模式：播完当前句就停止
  _startSingleMonitoring(index) {
    this._stopMonitoring();
    const sentence = this.sentences[index];
    if (!sentence) return;

    this._monitorId = setInterval(() => {
      if (this.audio.currentTime >= sentence.endTime) {
        this.pause();
        this._notifyState('ended');
        if (this._onEnd) this._onEnd();
      }
    }, 100);
  }

  _stopMonitoring() {
    if (this._monitorId) {
      clearInterval(this._monitorId);
      this._monitorId = null;
    }
  }

  _notifyState(state) {
    if (this._onStateChange) {
      this._onStateChange(state);
    }
  }
}

// 导出
window.AudioPlayer = AudioPlayer;
