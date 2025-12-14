import React from 'react';

const HexagonBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-hex z-0 opacity-40 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
    </div>
  );
};

export default HexagonBackground;