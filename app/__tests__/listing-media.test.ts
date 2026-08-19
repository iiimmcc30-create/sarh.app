import {
  cloudinaryVideoFirstFrameUrl,
  isEphemeralListingUploadUri,
  isListingVideoStillUri,
  isListingVideoUri,
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

  it('uses Cloudinary first frame when video-only listing has no photos', () => {
    const videoUrl =
      'https://res.cloudinary.com/demo/video/upload/v1/safat/listings/clip.mp4';
    const listing = {
      images: [] as string[],
      videoUrl,
    };

    expect(listingPhotoUris(listing)).toEqual([]);
    expect(listingThumbUri(listing)).toBe(
      'https://res.cloudinary.com/demo/video/upload/so_0,f_jpg,q_auto/v1/safat/listings/clip.jpg',
    );
    expect(cloudinaryVideoFirstFrameUrl(videoUrl)).toContain('so_0,f_jpg');
  });

  it('treats Cloudinary video stills as photos, not playable video', () => {
    const still =
      'https://res.cloudinary.com/demo/video/upload/so_0,f_jpg,q_auto/v1/safat/listings/clip.jpg';
    expect(isListingVideoStillUri(still)).toBe(true);
    expect(isListingVideoUri(still)).toBe(false);
    expect(listingPhotoUris({ images: [still] })).toEqual([still]);
    expect(listingThumbUri({ images: [still], videoUrl: undefined })).toBe(still);
  });

  it('prefers durable Cloudinary thumb over ephemeral /uploads photo on cards', () => {
    const listing = {
      images: [
        'https://sarh-new4.onrender.com/uploads/listings/dead.jpeg',
      ],
      thumbnailUrl:
        'https://res.cloudinary.com/demo/image/upload/v1/sarh/listings/thumb.jpg',
      videoUrl:
        'https://res.cloudinary.com/demo/video/upload/v1/sarh/listings/clip.mp4',
    };

    expect(isEphemeralListingUploadUri(listing.images[0])).toBe(true);
    expect(listingThumbUri(listing)).toBe(listing.thumbnailUrl);
  });

  it('does not expose ephemeral /uploads photos in the gallery', () => {
    expect(
      listingPhotoUris({
        images: ['https://sarh-new4.onrender.com/uploads/listings/dead.jpeg'],
      }),
    ).toEqual([]);
  });

  it('keeps a durable photo as the outer card cover when available', () => {
    const photo =
      'https://res.cloudinary.com/demo/image/upload/v1/sarh/listings/photo.jpg';
    const listing = {
      images: [photo],
      thumbnailUrl:
        'https://res.cloudinary.com/demo/image/upload/v1/sarh/listings/thumb.jpg',
      videoUrl:
        'https://res.cloudinary.com/demo/video/upload/v1/sarh/listings/clip.mp4',
    };

    expect(listingThumbUri(listing)).toBe(photo);
  });
});
