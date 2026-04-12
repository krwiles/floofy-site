export class GalleryImage {
    constructor(
        public readonly src: string,
        public readonly alt: string,
        public readonly width: number,
        public readonly height: number
    ) {}

    getScaledWidthFromHeight(height: number): number {
        const ratio: number = this.width / this.height;
        return Math.round(height * ratio);
    }

    getScaledHeightFromWidth(width: number): number {
        const ratio: number = this.height / this.width;
        return Math.round(width * ratio);
    }

    static fromObject(obj: { src: string; alt: string; width: number; height: number }): GalleryImage {
        return new GalleryImage(obj.src, obj.alt, obj.width, obj.height);
    }
}