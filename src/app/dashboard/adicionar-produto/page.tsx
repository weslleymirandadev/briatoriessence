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

const schema = z.object({
  images: z
    .array(z.instanceof(File))
    .min(1, "Pelo menos uma imagem é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.number(),
  discountedPrice: z.number().default(0),
  description: z.string().min(1, "Descrição é obrigatória"),
  tags: z.string().min(1, "Tags são obrigatórias"),
  peso: z.number().default(0.3),
  altura: z.number().default(0),
  largura: z.number().default(0),
  comprimento: z.number().default(0),
});

type FormDataType = z.infer<typeof schema>;

export default function AdicionarProduto() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: zodResolver(schema),
    defaultValues: {
      discountedPrice: 0,
      peso: 0.3,
      altura: 22,
      largura: 16,
      comprimento: 8,
    },
  });

  const [images, setImages] = useState<File[]>([]);
  const [disabled, setDisabled] = useState<boolean>(false);

  const router = useRouter();

  const onSubmit = async (data: FormDataType) => {
    setDisabled(true);
    const formData = new FormData();
    formData.append("nome", data.name);
    formData.append("preco", data.price.toString());
    formData.append("precoDes", data.discountedPrice.toString());
    formData.append("descricao", data.description.toString());
    formData.append("tags", data.tags);
    images.forEach((image) => {
      formData.append("imagens", image);
    });
    formData.append("peso", data.peso.toString());
    formData.append("altura", data.altura.toString());
    formData.append("largura", data.largura.toString());
    formData.append("comprimento", data.comprimento.toString());

    // Enviar o formData para o servidor
    await axios
      .post(`/api/produtos/${data.name}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(() => {
        Swal.fire({
          title: "Sucesso!",
          text: "Produto adicionado com sucesso.",
          icon: "success",
          confirmButtonText: "Ok",
          color: "black", // Cor do texto
          confirmButtonColor: "#F8C8DC", // Cor do botão
        });
        setDisabled(false);
        router.push("/dashboard");
      })
      .catch((error) => {
        Swal.fire({
          title: "Erro!",
          text: "Erro ao adicionar produto: " + error,
          icon: "error",
          confirmButtonText: "Ok",
          color: "black", // Cor do texto
          confirmButtonColor: "#F8C8DC", // Cor do botão
        });
        setDisabled(false);
      });
  };

  const handleDrop = (acceptedFiles: File[]) => {
    const newImages = [...images, ...acceptedFiles];
    setImages(newImages);
    setValue("images", newImages, { shouldValidate: true });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setValue("images", newImages, { shouldValidate: true });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "image/*": [],
    },
  });

  return (
    <div className="flex pt-10 justify-center relative items-center h-full top-[100px]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border-2 bg-white border-gray-300 p-6 rounded-md w-full md:max-w-[450px] shadow-xl space-y-4 my-5"
      >
        <h1 className="text-2xl font-bold mb-4 text-black">
          Adicionar Produto
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
              Clique para selecionar (dimensões: 400x400)
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

        <div className="relative">
          <input
            id="name"
            {...register("name")}
            className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
              errors.name ? "border-red-400" : "border-gray-300"
            }`}
            placeholder=" "
          />
          <label
            htmlFor="name"
            className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
              errors.name ? "text-red-400" : "text-gray-300"
            } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
          >
            Nome*
          </label>
          {errors.name && (
            <span className="text-red-400">{errors.name.message}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.price ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="price"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
                errors.price ? "text-red-400" : "text-gray-300"
              } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Preço*
            </label>
            {errors.price && (
              <span className="text-red-400">{errors.price.message}</span>
            )}
          </div>

          <div className="relative">
            <input
              id="discountedPrice"
              type="number"
              step="0.01"
              {...register("discountedPrice", { valueAsNumber: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.discountedPrice ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="discountedPrice"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
                errors.discountedPrice ? "text-red-400" : "text-gray-300"
              } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Preço Desconto
            </label>
            {errors.discountedPrice && (
              <span className="text-red-400">
                {errors.discountedPrice.message}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={5}
            id="description"
            {...register("description")}
            className={`resize-none peer w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
              errors.description ? "border-red-400" : "border-gray-300"
            }`}
            placeholder=" "
          />
          <label
            htmlFor="description"
            className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
              errors.description ? "text-red-400" : "text-gray-300"
            } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
          >
            Descrição*
          </label>
          {errors.description && (
            <span className="text-red-400">{errors.description.message}</span>
          )}
        </div>

        <div className="relative">
          <input
            id="tags"
            type="text"
            {...register("tags")}
            className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
              errors.tags ? "border-red-400" : "border-gray-300"
            }`}
            placeholder=" "
          />
          <label
            htmlFor="tags"
            className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
              errors.tags ? "text-red-400" : "text-gray-300"
            } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
          >
            Tags*
          </label>
          {errors.tags && (
            <span className="text-red-400">{errors.tags.message}</span>
          )}
        </div>

        <section className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              id="peso"
              step="0.01"
              type="number"
              {...register("peso", { valueAsNumber: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.peso ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="number"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
                errors.peso ? "text-red-400" : "text-gray-300"
              } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Peso (kg)*
            </label>
            {errors.peso && (
              <span className="text-red-400">{errors.peso.message}</span>
            )}
          </div>

          <div className="relative">
            <input
              id="altura"
              type="number"
              {...register("altura", { valueAsNumber: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.altura ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="altura"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
                errors.altura ? "text-red-400" : "text-gray-300"
              } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Altura (cm)*
            </label>
            {errors.altura && (
              <span className="text-red-400">{errors.altura.message}</span>
            )}
          </div>

          <div className="relative mt-2">
            <input
              id="largura"
              type="number"
              {...register("largura", { valueAsNumber: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.largura ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="largura"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
                errors.largura ? "text-red-400" : "text-gray-300"
              } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Largura (cm)*
            </label>
            {errors.largura && (
              <span className="text-red-400">{errors.largura.message}</span>
            )}
          </div>

          <div className="relative mt-2">
            <input
              id="comprimento"
              type="number"
              {...register("comprimento", { valueAsNumber: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.comprimento ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="comprimento"
              className={`select-none absolute bg-white p-[2px] left-3 transition-all peer-placeholder-shown:top-[0.45rem] peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 top-[-0.8rem] text-sm ${
                errors.comprimento ? "text-red-400" : "text-gray-300"
              } peer-focus:text-[var(--primary)] peer-focus:top-[-0.8rem] peer-focus:text-sm`}
            >
              Comprimento (cm)*
            </label>
            {errors.comprimento && (
              <span className="text-red-400">{errors.comprimento.message}</span>
            )}
          </div>
        </section>

        <button
          type="submit"
          disabled={disabled}
          className={`${
            disabled
              ? "bg-black text-white cursor-wait"
              : "bg-white text-black cursor-pointer"
          } border border-black hover:bg-black hover:text-white transition-colors duration-200 px-4 py-2 rounded-md shadow-sm`}
        >
          Adicionar Produto
        </button>
      </form>
    </div>
  );
}
