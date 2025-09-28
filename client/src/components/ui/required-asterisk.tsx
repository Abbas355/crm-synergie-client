import React from "react";

interface RequiredAsteriskProps {
  className?: string;
}

export const RequiredAsterisk: React.FC<RequiredAsteriskProps> = ({ className }) => {
  return <span className={`text-red-500 ml-1 ${className || ""}`}>*</span>;
};