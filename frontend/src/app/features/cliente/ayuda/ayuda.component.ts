import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ayuda-container">
      <div class="header">
        <h1>Centro de Ayuda</h1>
        <p>Encuentra respuestas a las preguntas más frecuentes</p>
      </div>

      <div class="content">
        <!-- FAQ Section -->
        <section class="faq-section">
          <h2>Preguntas Frecuentes</h2>
          
          <div class="faq-item">
            <h3>¿Cómo puedo crear un requerimiento?</h3>
            <p>Utiliza nuestro Chat Asistente para describir tu proyecto. El asistente te ayudará a definir los detalles y conectarte con el vendedor perfecto para tu necesidad.</p>
          </div>

          <div class="faq-item">
            <h3>¿Cómo funciona el proceso de contratación?</h3>
            <p>Una vez que publiques tu requerimiento, los vendedores especializados podrán ver tu solicitud y enviar propuestas. Podrás revisar sus perfiles, experiencia y presupuestos antes de tomar una decisión.</p>
          </div>

          <div class="faq-item">
            <h3>¿Qué tipo de servicios puedo solicitar?</h3>
            <p>Nuestra plataforma se especializa en servicios de TI: desarrollo de software, aplicaciones móviles, sitios web, sistemas de inventario, consultoría tecnológica, ciberseguridad y más.</p>
          </div>

          <div class="faq-item">
            <h3>¿Cómo puedo dar seguimiento a mis proyectos?</h3>
            <p>En la sección "Estado Proyectos" puedes ver el progreso de todos tus proyectos activos, comunicarte con los vendedores y recibir actualizaciones en tiempo real.</p>
          </div>

          <div class="faq-item">
            <h3>¿Es seguro compartir mi información?</h3>
            <p>Sí, todos nuestros vendedores están verificados y la plataforma cuenta con protocolos de seguridad para proteger tu información personal y comercial.</p>
          </div>
        </section>

        <!-- Contact Section -->
<section class="contact-section">
  <h2>¿Necesitas más ayuda?</h2>
  <div class="contact-options">
    <div class="contact-card">
      <div class="contact-icon">📧</div>
      <h3>Email</h3>
      <p>soporte&#64;gestorvirtal.com</p>
      <p>Respuesta en 24 horas</p>
    </div>

    <div class="contact-card">
      <div class="contact-icon">📞</div>
      <h3>Teléfono</h3>
      <p>+593 99 123 4567</p>
      <p>Lunes a Viernes 9:00 - 18:00</p>
    </div>
  </div>
</section>

       <!-- Solo el botón de regreso -->
<div style="text-align: center; margin-top: 40px;">
  <button class="btn-back" [routerLink]="['/cliente/bienvenida']">
    ← Volver al Dashboard
  </button>
</div>
  `,
  styles: `
    .ayuda-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 40px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px;
    }

    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .header p {
      font-size: 1.2rem;
      opacity: 0.9;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    /* FAQ Section */
    .faq-section h2 {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 25px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }

    .faq-item {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
    }

    .faq-item h3 {
      color: #333;
      font-size: 1.2rem;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .faq-item p {
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    /* Contact Section */
    .contact-section h2 {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 25px;
      border-bottom: 3px solid #764ba2;
      padding-bottom: 10px;
    }

    .contact-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .contact-card {
      background: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      text-align: center;
      transition: transform 0.3s ease;
    }

    .contact-card:hover {
      transform: translateY(-5px);
    }

    .contact-icon {
      font-size: 2.5rem;
      margin-bottom: 15px;
    }

    .contact-card h3 {
      color: #333;
      font-size: 1.3rem;
      margin-bottom: 10px;
    }

    .contact-card p {
      color: #666;
      margin-bottom: 8px;
      font-size: 0.95rem;
    }

    .btn-chat {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: transform 0.3s ease;
      margin-top: 10px;
    }

    .btn-chat:hover {
      transform: translateY(-2px);
    }

    /* Back Button */
    .back-section {
      text-align: center;
      margin-top: 40px;
    }

    .btn-back {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .btn-back:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    /* Links Section */
    .links-section h2 {
      color: #333;
      font-size: 1.8rem;
      margin-bottom: 25px;
      border-bottom: 3px solid #4facfe;
      padding-bottom: 10px;
    }

    .quick-links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .link-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      text-decoration: none;
      color: #333;
      text-align: center;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .link-card:hover {
      transform: translateY(-3px);
      border-color: #667eea;
      color: #667eea;
    }

    .link-icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }

    .link-card span {
      font-weight: 600;
      font-size: 1.1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .ayuda-container {
        padding: 15px;
      }

      .header h1 {
        font-size: 2rem;
      }

      .header p {
        font-size: 1rem;
      }

      .contact-options,
      .quick-links {
        grid-template-columns: 1fr;
      }

      .faq-item,
      .contact-card,
      .link-card {
        padding: 20px;
      }
    }
  `
})
export class AyudaComponent {}