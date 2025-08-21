document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('video');
  const videoTitle = document.getElementById('videoTitle');
  const videoYear = document.getElementById('videoYear');
  const videoStart = document.getElementById('videoStart');
  const videoEnd = document.getElementById('videoEnd');
  const episodeList = document.getElementById('episodeList');
  const infoPanel = document.getElementById('infoPanel');
  const toggleBtn = document.getElementById('toggleBtn');

  // 获取URL参数
  const urlParams = new URLSearchParams(window.location.search);
  const videoName = urlParams.get('name');
  const videoUrl = urlParams.get('url');
  const videoEps = urlParams.get('eps');

  // 切换信息面板
  toggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    infoPanel.classList.toggle('collapsed');
  });

  // 点击视频区域时关闭信息面板
  document.addEventListener('click', function (e) {
    if (!infoPanel.contains(e.target) && !toggleBtn.contains(e.target)) {
      infoPanel.classList.remove('collapsed');
    }
  });

  document.addEventListener('keydown', function (event) {
    switch (event.key) {
      case 'ArrowUp': // 遥控器上键
        console.log('上键被按下');
        // if (video.volumn <= 90) {
        //   video.volumn += 10;
        // } else {
        //   video.volumn = 100;
        // }
        setDuration(parseInt(video.currentTime));
        break;
      case 'ArrowDown': // 遥控器下键
        console.log('下键被按下');
        // if (video.volumn >= 10) {
        //   video.volumn -= 10;
        // } else {
        //   video.volumn = 0;
        // }
        setDuration(parseInt(video.currentTime), true);
        break;
      case 'ArrowLeft': // 遥控器左键
        // console.log('左键被按下');
        if (video.currentTime >= 15) {
          video.currentTime -= 15;
        } else {
          video.currentTime = 0;
        }
        break;
      case 'ArrowRight': // 遥控器右键
        // console.log('右键被按下');
        if (video.currentTime < video.duration) {
          video.currentTime += 15;
        } else {
          video.currentTime = video.duration;
        }
        break;
      case ' ':
      case 'Space':
      case 'Enter': // 遥控器确认键
        // console.log('确认键被按下');
        video.paused ? video.play() : video.pause();
        break;
      case 'Escape':
      case 'Backspace': // 遥控器返回键
        // console.log('返回键被按下');
        window.history.back();
        break;
      default:
        console.log(`[${event.key}]键被按下`);
    }
  });

  // 统一监听 loadedmetadata
  video.addEventListener('loadedmetadata', function () {
    if (!isNaN(video.duration)) {
      sessionStorage.setItem('videoDuration', video.duration);
    }
  });

  video.addEventListener('timeupdate', function () {
    // console.log(`timeupdate 获取视频时长成功: ${video.duration}秒`);
    let skipHead = 0, skipTail = 0;
    const sessionStartData = sessionStorage.getItem('videoStart');
    if (sessionStartData) {
      skipHead = parseInt(sessionStartData);
      videoStart.textContent = `片头: ${secondsToHms(skipHead)}`;
    }
    const sessionEndData = sessionStorage.getItem('videoEnd');
    if (sessionEndData) {
      skipTail = parseInt(sessionEndData);
      videoEnd.textContent = `片尾: ${secondsToHms(parseInt(video.duration) - skipTail)}`;
    }
    // 1. 片头
    if (video.currentTime > 0 && skipHead > 0 && video.currentTime < skipHead) {
      video.currentTime = skipHead;
    }
    // 2. 片尾
    if (video.currentTime > 0 && skipTail > 0 && video.currentTime >= skipTail) {
      video.currentTime = video.duration;
    }
  })

  if (videoUrl) {
    // 如果提供了视频URL，直接播放
    videoTitle.textContent = videoName;
    videoYear.textContent = "剧集：" + videoEps;

    // 清空剧集列表
    episodeList.innerHTML = '';
    playM3u8(videoUrl);
    return;
  }

  if (!videoName) {
    alert('未指定视频名称');
    return;
  }

  // 加载视频信息
  async function loadVideoInfo() {
    try {
      const response = await fetch(`/api/video?name=${encodeURIComponent(videoName)}`);
      if (!response.ok) {
        throw new Error('获取视频信息失败');
      }

      const data = await response.json();
      displayVideoInfo(data);
    } catch (error) {
      console.error('加载视频信息出错:', error);
      alert('加载视频信息失败');
    }
  }

  // 显示视频信息和剧集列表
  function displayVideoInfo(data) {
    if (!data || !data.data || data.data.length === 0) {
      alert('未找到视频信息');
      return;
    }

    const videoData = data.data[0];
    videoTitle.textContent = videoData.name;
    videoYear.textContent = "年份：" + videoData.year;

    // 清空剧集列表
    episodeList.innerHTML = '';

    // 根据类型处理剧集
    if (data.type === 'tv' && videoData.source.eps && videoData.source.eps.length > 0) {
      // 电视剧：显示所有剧集
      videoData.source.eps.forEach((ep, index) => {
        const episodeItem = createEpisodeItem(ep, index === 0);
        episodeList.appendChild(episodeItem);
      });
      // 自动播放第一集
      playM3u8(videoData.source.eps[0].url);
    } else if (data.type === 'movie' && videoData.source.eps && videoData.source.eps.length > 0) {
      // 电影：通常只有一个播放源
      const episodeItem = createEpisodeItem(videoData.source.eps[0], true);
      episodeList.appendChild(episodeItem);
      playM3u8(videoData.source.eps[0].url);
    }
  }

  // 创建剧集项
  function createEpisodeItem(episode, isActive) {
    const item = document.createElement('div');
    item.className = `episode-item${isActive ? ' active' : ''}`;
    item.textContent = episode.name;
    item.addEventListener('click', function () {
      // 移除其他剧集的活动状态
      document.querySelectorAll('.episode-item').forEach(el => {
        el.classList.remove('active');
      });
      // 添加当前剧集的活动状态
      item.classList.add('active');
      // 播放视频
      playM3u8(episode.url, false);
    });
    return item;
  }

  // 播放m3u8视频
  function playM3u8(url, autoplay = true) {
    let m3u8Url = decodeURIComponent(url);
    if (Hls.isSupported()) { // 1) Hls.js 分支
      var hls = new Hls({
        // debug: true
      });
      hls.loadSource(m3u8Url);
      hls.attachMedia(video);
      // Fired when MediaSource has been successfully attached to media element
      // hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      //   video.muted = autoplay;
      //   video.play();
      // });
      // Fired after manifest has been parsed
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) {
          video.muted = autoplay;
        }
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) { // 原生 HLS（Safari）分支
      video.src = m3u8Url;
      if (autoplay) {
        video.muted = autoplay;
      }
      video.play();
    }
  }

  // 设置片头/片尾时长
  function setDuration(duration, videoEnd = false) {
    if (videoEnd) {
      sessionStorage.setItem('videoEnd', parseInt(duration));
    } else {
      sessionStorage.setItem('videoStart', parseInt(duration));
    }
  }

  function secondsToHms(seconds) {
    // 计算小时数
    const h = Math.floor(seconds / 3600);
    // 计算剩余的秒数
    const m = Math.floor((seconds % 3600) / 60);
    // 计算最终的秒数
    const s = seconds % 60;
    // 格式化输出，使得小时、分钟和秒数总是两位数
    const hDisplay = h > 0 ? (h < 10 ? '0' + h : h) + ':' : '00:';
    const mDisplay = m > 0 ? (m < 10 ? '0' + m : m) + ':' : '00:';
    const sDisplay = s > 0 ? (s < 10 ? '0' + s : s) : '00';
    return hDisplay + mDisplay + sDisplay;
  }

  // 加载视频信息
  loadVideoInfo();
});