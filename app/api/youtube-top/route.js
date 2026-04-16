import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  // Ако няма конфигурация – ЯСНА ГРЕШКА, за да знаем какво да оправяме
  if (!apiKey || !channelId) {
    console.error('❌ YouTube API not configured: missing API_KEY or CHANNEL_ID');
    return NextResponse.json({ error: 'YouTube API not configured' }, { status: 500 });
  }

  try {
    // 1. Вземи най-гледаните видеа от канала
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=viewCount&type=video&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.error) {
      console.error('YouTube API error:', searchData.error);
      return NextResponse.json({ error: searchData.error.message }, { status: 500 });
    }

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ success: true, videos: [] });
    }

    const videoIds = searchData.items.map(item => item.id.videoId).join(',');
    
    // 2. Вземи статистика (гледания)
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();

    const videos = statsData.items.map(item => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      views: parseInt(item.statistics.viewCount).toLocaleString(),
      likes: parseInt(item.statistics.likeCount).toLocaleString(),
      videoUrl: `https://www.youtube.com/watch?v=${item.id}`
    }));

    return NextResponse.json({ success: true, videos });

  } catch (error) {
    console.error('YouTube API fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}