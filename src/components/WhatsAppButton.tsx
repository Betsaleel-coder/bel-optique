import WhatsAppIcon from './WhatsAppIcon';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/242044744456"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-all transform hover:scale-110 flex items-center justify-center"
      aria-label="Contacter sur WhatsApp"
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
