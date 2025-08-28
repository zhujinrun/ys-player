document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('video');
  const videoTitle = document.getElementById('videoTitle');
  const videoType = document.getElementById('videoType');
  const videoYear = document.getElementById('videoYear');
  const videoStart = document.getElementById('videoStart');
  const videoEnd = document.getElementById('videoEnd');
  const episodeList = document.getElementById('episodeList');
  const infoPanel = document.getElementById('infoPanel');
  const toggleBtn = document.getElementById('toggleBtn');

  // 获取URL参数
  const urlParams = new URLSearchParams(window.location.search);
  const name = urlParams.get('name');

  if (!name) {
    alert('请指定视频名称');
    return;
  }

  console.debug('准备播放:', name);

  const year = urlParams.get('year');
  const eps = urlParams.get('eps');

  // 数据
  let _year = year ?? '';
  let _type = eps == null ? '连续剧' : '电影';

  let _sourceIndex = 0;
  let _sources = [];
  let _epIndex = 0;
  let _eps = [];

  if (eps) {
    // 如果提供了视频源，直接播放
    _sources = [{ name: name, year: _year, source: { eps: JSON.parse(decodeURIComponent(atob(eps))) } }]
    playSource();
  } else {
    // 加载视频信息，并播放第一个视频源
    loadVideoInfo(name);
  }

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

  // 加载视频信息
  async function loadVideoInfo(name) {
    try {
      const response = await fetch(`/api/video?name=${encodeURIComponent(name)}`);
      if (!response.ok) {
        throw new Error('获取视频信息失败');
      }
      const data = await response.json();
      console.debug('视频数据:', data);

      _sources = data.data ?? [];

      if (data.type == 'movie') {
        _type = '电影';
        // 处理电影类型
        if (_sources.length > 0) {
          await playSource();
        } else {
          console.debug('没有找到任何电影: ', _sources);
        }
      } else if (data.type == 'tv') {
        _type = '电视剧';
        // 处理电视剧类型
        if (_sources.length > 0) {
          await playSource();
        } else {
          console.debug('没有找到任何剧集: ', _sources);
        }
      } else {
        _type = '未知';
        console.debug('未知视频类型: ', data);
      }
    } catch (error) {
      console.error('加载视频信息出错:', error);
      alert('加载视频信息失败');
    }
  }

  // 播放视频源
  async function playSource(index = 0) {
    console.debug('正在播放源：', index);

    _eps = _sources[index].source.eps;
    _year = _sources[index].year;

    videoTitle.textContent = name;
    if (_sources.length > 1) {
      videoTitle.style.cursor = "pointer";
      videoTitle.setAttribute("title", "点击可切换视频源");
      videoTitle.addEventListener("click", function () {
        changeSource();
      });
    }
    if (_type && _type.length > 0) {
      videoType.textContent = "类型：" + _type;
    }
    if (_year && _year.length > 0) {
      videoYear.textContent = "年份：" + _year;
    }

    // 清空剧集列表
    _epIndex = 0;
    episodeList.innerHTML = '';

    if (_eps && _eps.length > 0) {
      _eps.forEach((ep, index) => {
        const episodeItem = createEpisodeItem(ep, index);
        episodeList.appendChild(episodeItem);
      });

      // 自动播放
      playM3u8(_eps[0].url);
    }
  }

  // 切换视频源
  async function changeSource() {
    // 增加 _sourceIndex
    _sourceIndex++;
    // 如果 _sourceIndex 超出了 _sources 的长度，重置为 0
    if (_sourceIndex >= _sources.length) {
      _sourceIndex = 0;
    }
    await playSource(_sourceIndex);
  }

  // 创建剧集项
  function createEpisodeItem(episode, index) {
    const item = document.createElement('div');
    const isActive = index === _epIndex;
    item.className = `episode-item${isActive ? ' active' : ''}`;
    item.textContent = episode.name;
    item.addEventListener('click', function () {
      // 移除其他剧集的活动状态
      document.querySelectorAll('.episode-item').forEach(el => {
        el.classList.remove('active');
      });
      // 添加当前剧集的活动状态
      item.classList.add('active');
      _epIndex = index;
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
      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          // switch (data.type) {
          //   case Hls.ErrorTypes.NETWORK_ERROR:
          //     hls.startLoad();
          //     break;
          //   case Hls.ErrorTypes.MEDIA_ERROR:
          //     hls.recoverMediaError();
          //     break;
          //   default:
          //     hls.destroy();
          //     break;
          // }
          const _changeSource = confirm(_sources.length > 1 ? "视频播放出错，是否换源播放？" : "视频播放出错，是否尝试播放？");
          if (_changeSource) {
            _sources.length > 1 ? changeSource() : playSource();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) { // 原生 HLS（Safari）分支
      video.src = m3u8Url;
      if (autoplay) {
        video.muted = autoplay;
      }
      video.play();
    } else {
      console.error('Your browser does not support HLS playback.');
      alert('浏览器不支持 HLS 播放');
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
});