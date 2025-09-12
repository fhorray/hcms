import React from 'react';

const CustomLoader = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32"></div>
    </div>
  );
};

export default CustomLoader;
