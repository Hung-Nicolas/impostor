import { motion } from 'framer-motion';

export function Logo() {
  const title = 'EL IMPOSTOR';
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h1
        className="text-[44px] font-black tracking-tighter text-[#00E5CC] leading-none"
        style={{ textShadow: '0 0 24px rgba(0,229,204,0.35), 0 0 48px rgba(0,229,204,0.1)' }}
      >
        {title.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
            className="inline-block"
            style={{ minWidth: char === ' ' ? '0.3em' : undefined }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </h1>
    </motion.div>
  );
}
