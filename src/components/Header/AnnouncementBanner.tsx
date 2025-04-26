"use client";

import React from "react";

interface AnnouncementBannerProps {
  shrink: boolean;
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ shrink }) => (
  <div
    className={`w-full text-center bg-white font-bold text-black transition-all duration-300 ${
      shrink ? "h-0" : "h-6"
    } overflow-hidden`}
  >
    Ganhe 5% de desconto com pagamento via pix!
  </div>
);

export default AnnouncementBanner;
