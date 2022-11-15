import { Component } from '@angular/core';
import { Camera, CameraOptions } from '@awesome-cordova-plugins/camera/ngx';
import {
  OCR,
  OCRResult,
  OCRSourceType,
} from '@awesome-cordova-plugins/ocr/ngx';
import {
  OpenALPR,
  OpenALPROptions,
  OpenALPRResult,
} from '@awesome-cordova-plugins/openalpr/ngx';
declare var window: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  base64Image = '';
  plate = '';
  confidence = '';
  processing = false;
  options: CameraOptions = {
    quality: 100,
    destinationType: this.camera.DestinationType.DATA_URL,
    encodingType: this.camera.EncodingType.JPEG,
    mediaType: this.camera.MediaType.PICTURE,
    saveToPhotoAlbum: false,
  };

  scanOptions: OpenALPROptions = {
    country: this.openALPR.Country.US,
    amount: 2,
  };

  constructor(
    private camera: Camera,
    private openALPR: OpenALPR,
    private ocr: OCR
  ) {}

  onCamera() {
    this.camera.getPicture(this.options).then(
      (imageData) => {
        this.base64Image = 'data:image/jpeg;base64,' + imageData;
      },
      (err) => {
        console.log(err);
      }
    );
  }

  onPlate() {
    this.processing = true;
    this.base64Image = '';
    this.confidence = '';
    this.plate = '';
    this.camera
      .getPicture(this.options)
      .then((imageData) => {
        this.base64Image = 'data:image/jpeg;base64,' + imageData;
        return this.openALPR.scan(imageData, this.scanOptions);
      })
      .then((res: [OpenALPRResult]) => {
        console.log(res);
        if (res.length > 0) {
          this.plate = res[0].number;
          this.confidence = res[0].confidence.toFixed(2);
        }
      })
      .catch((error: Error) => console.error(error))
      .finally(() => (this.processing = false));
  }

  onOCR() {
    this.processing = true;
    this.base64Image = '';
    this.confidence = '';
    this.plate = '';
    const regex = new RegExp(/^[A-Z]{3}\s[0-9]{3}$/g);
    this.camera
      .getPicture({
        ...this.options,
        destinationType: this.camera.DestinationType.FILE_URI,
      })
      .then((imageData) => {
        this.base64Image = window.Ionic.WebView.convertFileSrc(imageData);
        return this.ocr.recText(OCRSourceType.NORMFILEURL, imageData);
      })

      .then((res: OCRResult) => {
        console.log(res);
        this.plate = res.blocks.blocktext.filter((t) => regex.test(t))[0];
      })
      .catch((error: any) => console.error(error))
      .finally(() => (this.processing = false));
  }
}
