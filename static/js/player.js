document.addEventListener('DOMContentLoaded', function () {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoTitle = document.getElementById('videoTitle');
  const videoYear = document.getElementById('videoYear');
  const episodeList = document.getElementById('episodeList');
  const infoPanel = document.getElementById('infoPanel');
  const toggleBtn = document.getElementById('toggleBtn');

  // 获取URL参数
  const urlParams = new URLSearchParams(window.location.search);
  const videoName = urlParams.get('name');

  if (!videoName) {
    alert('未指定视频名称');
    return;
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
      playVideo(videoData.source.eps[0].url);
    } else if (data.type === 'movie' && videoData.source.eps && videoData.source.eps.length > 0) {
      // 电影：通常只有一个播放源
      const episodeItem = createEpisodeItem(videoData.source.eps[0], true);
      episodeList.appendChild(episodeItem);
      playVideo(videoData.source.eps[0].url);
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
      playVideo(episode.url);
    });
    return item;
  }

  // 播放视频
  function playVideo(url) {
    videoPlayer.src = "https://m3u8player.org/player.html?url=" + url;
  }

  // 加载视频信息
  loadVideoInfo();
});
