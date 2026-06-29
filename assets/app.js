/**
 * NCE-Flow-Plus 主应用逻辑
 * 集成点读、跟读、评分功能
 */

class NCEApp {
  constructor() {
    this.currentBook = null;
    this.currentLesson = null;
    this.currentSentence = null;
    this.isPlaying = false;
    this.playMode = 'point'; // 'point' | 'continuous'
    this.speed = 1.0;
    this.theme = 'auto';
    
    // 跟读和评分模块
    this.recorder = new AudioRecorder();
    this.scorer = new PronunciationScorer();
    this.isFollowReading = false;
    
    // 学习记录
    this.history = this.loadHistory();
  }

  /**
   * 初始化应用
   */
  init() {
    console.log('🚀 NCE-Flow-Plus 初始化...');
    
    // 初始化主题
    this.initTheme();
    
    // 初始化跟读功能
    this.initFollowRead();
    
    // 绑定事件
    this.bindEvents();
    
    console.log('✅ 应用初始化完成');
  }

  /**
   * 初始化跟读功能
   */
  async initFollowRead() {
    try {
      // 初始化录音模块
      await this.recorder.init();
      console.log('✅ 录音模块已初始化');
      
      // 初始化评分模块
      this.scorer.init();
      console.log('✅ 评分模块已初始化');
    } catch (error) {
      console.error('❌ 跟读功能初始化失败:', error);
      this.showNotification('跟读功能不可用：' + error.message, 'error');
    }
  }

  /**
   * 开始跟读
   * @param {string} sentenceId - 句子 ID
   * @param {string} originalText - 原句文本
   */
  async startFollowRead(sentenceId, originalText) {
    console.log('🎤 开始跟读:', sentenceId);
    
    this.currentSentence = sentenceId;
    this.isFollowReading = true;
    
    // 更新 UI
    this.updateFollowReadUI(sentenceId, 'recording');
    
    // 播放提示音
    this.playBeep();
    
    // 延迟 500ms 后开始录音
    setTimeout(async () => {
      try {
        // 开始录音
        await this.recorder.startRecording();
        
        // 开始语音识别
        this.scorer.startRecognition(originalText);
        
        // 3秒后自动停止
        setTimeout(async () => {
          await this.stopFollowRead(sentenceId);
        }, 3000);
        
      } catch (error) {
        console.error('❌ 跟读失败:', error);
        this.showNotification('跟读失败：' + error.message, 'error');
        this.isFollowReading = false;
        this.updateFollowReadUI(sentenceId, 'idle');
      }
    }, 500);
  }

  /**
   * 停止跟读
   * @param {string} sentenceId - 句子 ID
   */
  async stopFollowRead(sentenceId) {
    console.log('🎤 停止跟读:', sentenceId);
    
    // 停止录音
    const audioBlob = await this.recorder.stopRecording();
    
    // 停止语音识别
    this.scorer.stopRecognition();
    
    // 计算评分
    const scoreResult = this.scorer.calculateScore();
    
    // 保存录音
    if (audioBlob) {
      this.saveRecording(sentenceId, audioBlob);
    }
    
    // 显示评分结果
    if (scoreResult) {
      this.showScoreResult(sentenceId, scoreResult);
    }
    
    // 更新 UI
    this.isFollowReading = false;
    this.updateFollowReadUI(sentenceId, 'scored');
    
    // 保存到学习记录
    this.saveLearningRecord(sentenceId, scoreResult);
  }

  /**
   * 播放提示音
   */
  playBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  /**
   * 更新跟读 UI
   * @param {string} sentenceId - 句子 ID
   * @param {string} state - 状态 ('idle' | 'recording' | 'scored')
   */
  updateFollowReadUI(sentenceId, state) {
    const btn = document.querySelector(`[data-sentence-id="${sentenceId}"] .follow-read-btn`);
    
    if (!btn) return;
    
    switch (state) {
      case 'idle':
        btn.textContent = '🎤 跟读';
        btn.disabled = false;
        btn.classList.remove('recording');
        break;
        
      case 'recording':
        btn.textContent = '🔴 录音中...';
        btn.disabled = false;
        btn.classList.add('recording');
        break;
        
      case 'scored':
        btn.textContent = '🎤 重新跟读';
        btn.disabled = false;
        btn.classList.remove('recording');
        break;
    }
  }

  /**
   * 显示评分结果
   * @param {string} sentenceId - 句子 ID
   * @param {Object} result - 评分结果
   */
  showScoreResult(sentenceId, result) {
    // 创建评分弹窗
    const modal = document.createElement('div');
    modal.className = 'score-modal';
    modal.innerHTML = `
      <div class="score-modal-content">
        <h3>📊 发音评分</h3>
        <div class="score-circle ${this.getScoreLevel(result.score)}">
          <span class="score-number">${result.score}</span>
          <span class="score-label">分</span>
        </div>
        <div class="score-details">
          <p><strong>识别文本：</strong>${result.recognizedText}</p>
          <p><strong>文本相似度：</strong>${result.textSimilarity.toFixed(1)}%</p>
          <p><strong>置信度：</strong>${(result.confidence * 100).toFixed(1)}%</p>
        </div>
        <div class="score-feedback">
          <p>${result.feedback.replace(/\n/g, '<br>')}</p>
        </div>
        <div class="score-actions">
          <button onclick="app.playOriginal('${sentenceId}')">🔊 听原音</button>
          <button onclick="app.playRecording('${sentenceId}')">🎤 听跟读</button>
          <button onclick="this.closest('.score-modal').remove()">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 3秒后自动关闭
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 5000);
  }

  /**
   * 获取评分等级
   * @param {number} score - 分数
   * @returns {string} 等级类名
   */
  getScoreLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    if (score >= 40) return 'poor';
    return 'very-poor';
  }

  /**
   * 播放原音
   * @param {string} sentenceId - 句子 ID
   */
  playOriginal(sentenceId) {
    // 实现播放原音逻辑
    console.log('🔊 播放原音:', sentenceId);
  }

  /**
   * 播放跟读录音
   * @param {string} sentenceId - 句子 ID
   */
  playRecording(sentenceId) {
    const audio = this.recorder.playRecording();
    if (!audio) {
      this.showNotification('没有可播放的录音', 'warning');
    }
  }

  /**
   * 保存录音
   * @param {string} sentenceId - 句子 ID
   * @param {Blob} audioBlob - 音频 Blob
   */
  saveRecording(sentenceId, audioBlob) {
    // 保存到 localStorage（实际应用中应该上传到服务器）
    const reader = new FileReader();
    reader.onload = () => {
      const base64Audio = reader.result;
      localStorage.setItem(`recording_${sentenceId}`, base64Audio);
      console.log('✅ 录音已保存:', sentenceId);
    };
    reader.readAsDataURL(audioBlob);
  }

  /**
   * 保存学习记录
   * @param {string} sentenceId - 句子 ID
   * @param {Object} scoreResult - 评分结果
   */
  saveLearningRecord(sentenceId, scoreResult) {
    const record = {
      sentenceId,
      score: scoreResult ? scoreResult.score : 0,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    
    if (!this.history.records) {
      this.history.records = [];
    }
    
    this.history.records.push(record);
    
    // 只保留最近 1000 条记录
    if (this.history.records.length > 1000) {
      this.history.records = this.history.records.slice(-1000);
    }
    
    this.saveHistory();
    console.log('✅ 学习记录已保存');
  }

  /**
   * 显示通知
   * @param {string} message - 消息
   * @param {string} type - 类型 ('info' | 'success' | 'warning' | 'error')
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * 初始化主题
   */
  initTheme() {
    const savedTheme = localStorage.getItem('nce-theme') || 'auto';
    this.theme = savedTheme;
    this.applyTheme();
  }

  /**
   * 应用主题
   */
  applyTheme() {
    if (this.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', this.theme);
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 主题切换
    document.addEventListener('click', (e) => {
      if (e.target.matches('.theme-toggle')) {
        this.toggleTheme();
      }
    });
    
    // 跟读按钮
    document.addEventListener('click', (e) => {
      if (e.target.matches('.follow-read-btn')) {
        const sentenceId = e.target.closest('[data-sentence-id]').dataset.sentenceId;
        const originalText = e.target.closest('[data-sentence-id]').dataset.originalText;
        
        if (this.isFollowReading) {
          this.stopFollowRead(sentenceId);
        } else {
          this.startFollowRead(sentenceId, originalText);
        }
      }
    });
  }

  /**
   * 加载学习记录
   */
  loadHistory() {
    const saved = localStorage.getItem('nce-history');
    return saved ? JSON.parse(saved) : { records: [] };
  }

  /**
   * 保存学习记录
   */
  saveHistory() {
    localStorage.setItem('nce-history', JSON.stringify(this.history));
  }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new NCEApp();
  app.init();
});

// 导出
window.NCEApp = NCEApp;
