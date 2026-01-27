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
  currentIndex = 0;

  openModal(imageSrc: string) {
    this.selectedImage = imageSrc;
    this.currentIndex = this.images.indexOf(imageSrc);
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modalOpen = false;
    document.body.style.overflow = '';
  }

  nextImage() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.selectedImage = this.images[this.currentIndex];
  }

  previousImage() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.selectedImage = this.images[this.currentIndex];
  }

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (this.modalOpen) {
      if (event.key === 'ArrowLeft') {
        this.previousImage();
      } else if (event.key === 'ArrowRight') {
        this.nextImage();
      } else if (event.key === 'Escape') {
        this.closeModal();
      }
    }
  }
}
