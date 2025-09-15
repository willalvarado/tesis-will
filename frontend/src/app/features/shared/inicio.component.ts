import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface CarouselImage {
  url: string;
  title: string;
  description: string;
}

interface AnimatedStats {
  clients: number;
  vendors: number;
  projects: number;
  rating: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {
  
  currentSlide = 0;

  carouselImages: CarouselImage[] = [
    {
      url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop',
      title: 'Desarrollo de Software',
      description: 'Soluciones personalizadas para tu negocio'
    },
    {
      url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
      title: 'Consultoría TI',
      description: 'Expertos en tecnología a tu servicio'
    },
    {
      url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
      title: 'Servicios en la Nube',
      description: 'Infraestructura moderna y escalable'
    },
    {
      url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=400&fit=crop',
      title: 'Ciberseguridad',
      description: 'Protección integral para tu empresa'
    },
    {
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
      title: 'Análisis de Datos',
      description: 'Insights inteligentes para tu negocio'
    }
  ];

  animatedStats: AnimatedStats = {
    clients: 1250,
    vendors: 480,
    projects: 2100,
    rating: '4.9'
  };

  // Métodos simples para el carrusel (sin auto-play ni intervalos)
  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.carouselImages.length;
  }

  prevSlide(): void {
    this.currentSlide = this.currentSlide === 0 
      ? this.carouselImages.length - 1 
      : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }
}