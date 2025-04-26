"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FaRegTrashAlt } from "react-icons/fa";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

// Definindo o schema com Zod
const schema = z.object({
  images: z
    .array(z.instanceof(File))
    .min(1, "Pelo menos uma imagem é obrigatória"),
});

type FormDataType = z.infer<typeof schema>;

export default function AdicionarBanner() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: zodResolver(schema),
  });

  const [images, setImages] = useState<File[]>([]);
  const [disabled, setDisabled] = useState<boolean>(false);

  const router = useRouter();

  // Função de envio do formulário
  const onSubmit = async (data: FormDataType) => {
    setDisabled(true);
    const formData = new FormData();
    images.forEach((image) => {
      formData.append("imagens", image);
    });

    try {
      await axios.post(`/api/banners`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({
        title: "Sucesso!",
        text: "Banner adicionado com sucesso.",
        icon: "success",
        confirmButtonText: "Ok",
        color: "black",
        confirmButtonColor: "#F8C8DC",
      });
      router.push("/dashboard");
    } catch (error) {
      Swal.fire({
        title: "Erro!",
        text: "Erro ao adicionar banner: " + error,
        icon: "error",
        confirmButtonText: "Ok",
        color: "black",
        confirmButtonColor: "#F8C8DC",
      });
    } finally {
      setDisabled(false);
    }
  };

  // Função para adicionar imagens
  const handleDrop = (acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles];
    setImages(newImages);
    setValue("images", newImages, { shouldValidate: true });
  };

  // Função para remover uma imagem
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setValue("images", newImages, { shouldValidate: true });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: { "image/*": [] },
  });

  return (
    <div className="flex pt-10 justify-center relative items-center h-full top-[100px]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border-2 bg-white border-gray-300 p-6 rounded-md w-full md:max-w-[450px] shadow-xl space-y-4 my-5"
      >
        <h1 className="text-2xl font-bold mb-4 text-black">
          Adicionar Banner
        </h1>

        <div className="relative">
          <div
            {...getRootProps()}
            className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none cursor-pointer ${
              errors.images ? "border-red-400" : "border-gray-300"
            }`}
          >
            <input {...getInputProps()} />
            <p className="peer-placeholder-shown:text-gray-400">
              Clique para selecionar (dimensões: 1280x720)
            </p>
          </div>
          <label
            htmlFor="images"
            className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
              errors.images ? "text-red-400" : "text-gray-300"
            } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
          >
            Imagens*
          </label>
          {errors.images && (
            <span className="text-red-400">{errors.images.message}</span>
          )}
          <div className="mt-2">
            {images.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 justify-between"
              >
                <section className="flex items-center space-x-2">
                  <Image
                    width={64}
                    height={64}
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-16 h-16 object-cover"
                  />
                  <p>{file.name}</p>
                </section>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="flex items-center cursor-pointer justify-center text-black p-4 border border-black w-16 rounded-md hover:bg-black hover:text-white transition-colors duration-200"
                >
                  <FaRegTrashAlt />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={disabled}
          className={`${
            disabled
              ? "bg-black text-white cursor-wait"
              : "bg-white text-black cursor-pointer"
          } border border-black hover:bg-black hover:text-white transition-colors duration-200 px-4 py-2 rounded-md shadow-sm`}
        >
          Adicionar Banner
        </button>
      </form>
    </div>
  );
}