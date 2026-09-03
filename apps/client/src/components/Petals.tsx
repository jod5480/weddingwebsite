import { useEffect, useState } from 'react';

const Petals = () => {
  const [petals, setPetals] = useState<any[]>([]);

  useEffect(() => {
    // Generate petals with random properties
    const newPetals = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      animationDelay: -(Math.random() * 20) + 's',
      animationDuration: 6 + Math.random() * 8 + 's',
      size: 12 + Math.random() * 12 + 'px',
      rotation: Math.random() * 360 + 'deg',
      swayDuration: 2 + Math.random() * 3 + 's'
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="petals-container">
      {petals.map(p => (
        <div 
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: `${p.animationDelay}, ${p.animationDelay}`,
            '--fall-duration': p.animationDuration,
            '--sway-duration': p.swayDuration,
            '--initial-rotation': p.rotation,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default Petals;
