import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    console.error('❌ Липсва YouTube API ключ или Channel ID');
    return NextResponse.json({ error: 'YouTube API not configured' }, { status: 500 });
  }

  try {
    // Взимаме ID-тата на най-гледаните видеа от канала
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=viewCount&type=video&key=${apiKey}`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.error) {
      console.error('YouTube API грешка:', searchData.error);
      return NextResponse.json({ error: searchData.error.message }, { status: 500 });
    }

    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Взимаме детайлна статистика за видеата
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
    console.error('Грешка при YouTube API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}