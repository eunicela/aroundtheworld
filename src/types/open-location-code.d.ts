declare module "open-location-code" {
  export class OpenLocationCode {
    isShort(code: string): boolean;
    isFull(code: string): boolean;
    recoverNearest(
      shortCode: string,
      referenceLatitude: number,
      referenceLongitude: number
    ): string;
    decode(code: string): {
      latitudeCenter: number;
      longitudeCenter: number;
    };
  }
}
