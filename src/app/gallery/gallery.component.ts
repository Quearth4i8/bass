import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-gallery',
  templateUrl: 'gallery.component.html',
  styleUrls: ['gallery.component.scss'],
})
export class GalleryComponent {
  images: string[] = [
    'assets/images/gallery/img1.jpg',
    'assets/images/gallery/img2.jpg',
    'assets/images/gallery/img3.jpg',
    'assets/images/gallery/img4.jpg',
    'assets/images/gallery/img5.jpg',
    'assets/images/gallery/img6.jpg',
    'assets/images/gallery/img7.jpg',
    'assets/images/gallery/img8.jpg',
    'assets/images/gallery/img9.jpg',
    'assets/images/gallery/img10.jpg',
    'assets/images/gallery/img11.jpg',
    'assets/images/gallery/img12.jpg',
    'assets/images/gallery/img13.jpg',
    'assets/images/gallery/img14.jpg',
    'assets/images/gallery/img15.jpg',
    'assets/images/gallery/img16.jpg',
    'assets/images/gallery/img17.jpg',
    'assets/images/gallery/img18.jpg',
    'assets/images/gallery/img19.jpg',
    'assets/images/gallery/img20.jpg',
    'assets/images/gallery/img21.jpg'
  ];

  modalOpen = false;
  selectedImage: string = '';

  openModal(imageSrc: string) {
    this.selectedImage = imageSrc;
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modalOpen = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.modalOpen) {
      this.closeModal();
    }
  }
}
