import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function Carousel({
  images,
  autoplayDelay = 3000,
}: {
  images: string[];
  autoplayDelay?: number;
}) {
  return (
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      spaceBetween={0}
      slidesPerView={1}
      autoplay={{
        delay: autoplayDelay,
        disableOnInteraction: false,
      }}
      pagination={{ clickable: true }}
      navigation
      loop={true}
      className="w-full md:max-w-[2280px] h-[30vh] md:h-[60vh] rounded-md select-none container"
    > 
      {images.map((image, index) => (
        <SwiperSlide key={index}>
          <Image
            quality={100}
            src={image}
            alt={`Slide ${index + 1}`}
            layout="fill"
            objectFit="cover"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
