document.addEventListener('DOMContentLoaded', function () {
  const video = document.getElementById('video');
  const videoTitle = document.getElementById('videoTitle');
  const videoYear = document.getElementById('videoYear');
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

  if (videoUrl) {
    // 如果提供了视频URL，直接播放
    videoTitle.textContent = videoName;
    videoYear.textContent = videoEps;
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
      playM3u8(episode.url);
    });
    return item;
  }

  // 播放m3u8视频
  function playM3u8(url) {
    let m3u8Url = decodeURIComponent(url);
    if (Hls.isSupported()) {
      var hls = new Hls({
        // debug: true
      });
      hls.loadSource(m3u8Url);
      hls.attachMedia(video);
      // Fired when MediaSource has been successfully attached to media element
      // hls.on(Hls.Events.MEDIA_ATTACHED, function () {
      //   video.muted = true;
      //   video.play();
      // });
      // Fired after manifest has been parsed
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        video.muted = true;
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = m3u8Url;
      video.addEventListener('canplay', function () {
        video.play();
      });
    }
  }

  // 加载视频信息
  loadVideoInfo();
});
