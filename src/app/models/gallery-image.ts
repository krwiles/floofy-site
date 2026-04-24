export class GalleryImage {
  constructor(
    public readonly srcFull: string,
    public readonly srcThumbnail: string,
    public readonly alt: string,
    public readonly widthFull: number,
    public readonly heightFull: number,
    public readonly widthThumbnail: number,
    public readonly heightThumbnail: number,
  ) {}

  getScaledWidthFromHeight(height: number): number {
    const ratio: number = this.widthFull / this.heightFull;
    return Math.round(height * ratio);
  }

  getScaledHeightFromWidth(width: number): number {
    const ratio: number = this.heightFull / this.widthFull;
    return Math.round(width * ratio);
  }

  static fromObject(obj: {
    srcFull: string;
    srcThumbnail: string;
    alt: string;
    widthFull: number;
    heightFull: number;
    widthThumbnail: number;
    heightThumbnail: number;
  }): GalleryImage {
    return new GalleryImage(
      obj.srcFull,
      obj.srcThumbnail,
      obj.alt,
      obj.widthFull,
      obj.heightFull,
      obj.widthThumbnail,
      obj.heightThumbnail,
    );
  }
}
