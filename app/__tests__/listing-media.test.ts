import {
  listingHasVideo,
  listingPhotoUris,
  listingThumbUri,
  listingVideoUrl,
} from '../lib/listingMedia';

describe('listingMedia', () => {
  it('uses dedicated videoUrl instead of image files', () => {
    const listing = {
      images: ['https://cdn.example/a.jpg'],
      videoUrl: 'https://cdn.example/clip.mp4',
      thumbnailUrl: 'https://cdn.example/thumb.jpg',
    };

    expect(listingHasVideo(listing)).toBe(true);
    expect(listingVideoUrl(listing)).toBe('https://cdn.example/clip.mp4');
    expect(listingPhotoUris(listing)).toEqual(['https://cdn.example/a.jpg']);
    expect(listingThumbUri(listing)).toBe('https://cdn.example/a.jpg');
  });

  it('falls back to a video file inside images and thumbnail cover', () => {
    const listing = {
      images: ['https://cdn.example/clip.mov'],
      thumbnailUrl: 'https://cdn.example/thumb.jpg',
    };

    expect(listingHasVideo(listing)).toBe(true);
    expect(listingVideoUrl(listing)).toBe('https://cdn.example/clip.mov');
    expect(listingPhotoUris(listing)).toEqual([]);
    expect(listingThumbUri(listing)).toBe('https://cdn.example/thumb.jpg');
  });

  it('detects Cloudinary video paths without a file extension', () => {
    const listing = {
      images: ['https://res.cloudinary.com/demo/video/upload/v1/safat/listings/clip'],
    };

    expect(listingHasVideo(listing)).toBe(true);
    expect(listingVideoUrl(listing)).toContain('/video/upload/');
    expect(listingPhotoUris(listing)).toEqual([]);
  });
});
