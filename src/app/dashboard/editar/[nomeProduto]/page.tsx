"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FaRegTrashAlt } from "react-icons/fa";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter, usePathname } from "next/navigation";

const schema = z.object({
  images: z.array(z.string()).min(1, "Pelo menos uma imagem é obrigatória"),
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

export default function EditarProduto() {
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
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
    mode: "onSubmit",
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();
  const pathname = usePathname();
  const produtoNomeSplit = pathname.split("/");
  const produtoNome = produtoNomeSplit[produtoNomeSplit.length - 1];

  // Atualiza o campo "images" do formulário sempre que existingImages ou newFiles mudam
  useEffect(() => {
    const previewUrls = newFiles.map((file) => URL.createObjectURL(file));
    const allImages = [...existingImages, ...previewUrls];
    setValue("images", allImages, { shouldValidate: true });
  }, [existingImages, newFiles, setValue]);

  const handleDeleteProduct = async () => {
    // Confirmação do usuário antes de excluir
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Esta ação não pode ser desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      // Envia a requisição DELETE para a API
      await axios.delete(`/api/produtos/${produtoNome}`);

      // Feedback de sucesso
      Swal.fire({
        title: "Sucesso!",
        text: "Produto excluído com sucesso.",
        icon: "success",
        confirmButtonText: "Ok",
        color: "black",
        confirmButtonColor: "#F8C8DC",
      });

      // Redireciona para a dashboard após a exclusão
      router.push("/dashboard");
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      Swal.fire({
        title: "Erro!",
        text: "Não foi possível excluir o produto.",
        icon: "error",
        confirmButtonText: "Ok",
        color: "black",
        confirmButtonColor: "#F8C8DC",
      });
    }
  };

  const handleRemoveImage = async (index: number) => {
    let imageUrl: string;
    let isCloudinary = false;

    if (index < existingImages.length) {
      imageUrl = existingImages[index];
      isCloudinary = imageUrl.includes("cloudinary");
    } else {
      const fileIndex = index - existingImages.length;
      imageUrl = URL.createObjectURL(newFiles[fileIndex]);
    }

    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Esta ação deletará a imagem permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, deletar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      if (isCloudinary) {
        await axios.delete(`/api/produtos/imagens/${produtoNome}`, {
          data: { imageUrl },
        });

        const newExisting = existingImages.filter((_, i) => i !== index);
        setExistingImages(newExisting);
      } else {
        const fileIndex = index - existingImages.length;
        const newFilesArray = newFiles.filter((_, i) => i !== fileIndex);
        setNewFiles(newFilesArray);
      }

      Swal.fire({
        title: "Sucesso!",
        text: "Imagem removida com sucesso.",
        icon: "success",
        confirmButtonText: "Ok",
        color: "black",
        confirmButtonColor: "#F8C8DC",
      });
    } catch (error) {
      console.error("Erro ao remover imagem:", error);
      Swal.fire({
        title: "Erro!",
        text: "Não foi possível remover a imagem.",
        icon: "error",
        confirmButtonText: "Ok",
        color: "black",
        confirmButtonColor: "#F8C8DC",
      });
    }
  };

  useEffect(() => {
    axios
      .get(`/api/produtos/${produtoNome}`)
      .then((response) => {
        const data = response.data.data;
        setValue("name", data.nome);
        setValue("price", data.precoOrg);
        setValue("discountedPrice", data.precoDes);
        setValue("description", data.descricao);
        setValue("tags", data.tags);
        setExistingImages(data.imagens);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar produto:", error);
        setLoading(false);
      });
  }, [produtoNome, setValue]);

  const onSubmit = async (data: FormDataType) => {
    const isValid = await trigger();
    if (!isValid) return;

    setDisabled(true);

    try {
      // Preparar o FormData para enviar as informações do produto
      const formData = new FormData();

      // Adicionar campos do formulário ao FormData
      formData.append("descricao", data.description);
      formData.append("preco", data.price.toString());
      formData.append("precoDes", data.discountedPrice.toString());
      formData.append("tags", data.tags);

      // Adicionar imagens existentes (que já estão no Cloudinary)
      existingImages.forEach((imageUrl) => {
        formData.append("imagens", imageUrl);
      });

      // Adicionar novas imagens (arquivos)
      newFiles.forEach((file) => {
        formData.append("imagens", file);
      });

      formData.append("peso", data.peso.toString());
      formData.append("altura", data.altura.toString());
      formData.append("largura", data.largura.toString());
      formData.append("comprimento", data.comprimento.toString());

      // Enviar a requisição PATCH para a API
      const response = await axios.patch(
        `/api/produtos/${produtoNome}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status === "success") {
        Swal.fire({
          title: "Sucesso!",
          text: "Produto atualizado com sucesso.",
          icon: "success",
          confirmButtonText: "Ok",
          color: "black",
          confirmButtonColor: "#F8C8DC",
        });

        // Redirecionar para a dashboard após a atualização
        router.push("/dashboard");
      } else {
        throw new Error(response.data.message || "Erro ao atualizar o produto");
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      Swal.fire({
        title: "Erro!",
        text: "Erro ao atualizar produto: " + error,
        icon: "error",
        confirmButtonText: "Ok",
        color: "black",
        confirmButtonColor: "#F8C8DC",
      });
    } finally {
      setDisabled(false);
    }
  };
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (acceptedFiles) => {
      setNewFiles((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const previewUrls = newFiles.map((file) => URL.createObjectURL(file));

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFiles]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="flex pt-10 justify-center relative items-center h-full top-[100px]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border-2 bg-white border-gray-300 p-6 rounded-md w-full md:max-w-[450px] shadow-xl space-y-4 my-5"
      >
        <h1 className="text-2xl font-bold mb-4 text-black">Editar Produto</h1>

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
            {[...existingImages, ...previewUrls].map((url, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 justify-between mb-2"
              >
                <section className="flex items-center space-x-2 max-w-[80%]">
                  <Image
                    width={64}
                    height={64}
                    src={url}
                    alt={`Image ${index}`}
                    className="w-16 h-16 object-cover"
                  />
                  <p className="line-clamp-1 text-black">
                    {index < existingImages.length
                      ? url.split("/").pop()
                      : (newFiles[index - existingImages.length] as File).name}
                  </p>
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
              type="text"
              {...register("peso", { valueAsNumber: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.peso ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="peso"
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
              type="text"
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

          <div className="relative">
            <input
              id="largura"
              type="text"
              {...register("largura", { valueAsNumber: true })}
              className={`peer h-10 w-full border rounded-md px-3 py-5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none ${
                errors.largura ? "border-red-400" : "border-gray-300"
              }`}
              placeholder=" "
            />
            <label
              htmlFor="largura mt-2"
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

          <div className="relative">
            <input
              id="comprimento mt-2"
              type="text"
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

        <section className="flex justify-between">
          <button
            type="submit"
            disabled={disabled}
            className={`${
              disabled
                ? "bg-black text-white cursor-wait"
                : "bg-white text-black cursor-pointer"
            } border border-black hover:bg-black hover:text-white transition-colors duration-200 px-4 py-2 rounded-md shadow-sm`}
          >
            Atualizar Produto
          </button>
          <button
            type="button"
            onClick={handleDeleteProduct}
            className="cursor-pointer hover:bg-red-500 text-red-500 hover:text-white border border-red-500 transition-colors duration-200 px-4 py-2 rounded-md shadow-sm"
          >
            Excluir Produto
          </button>
        </section>
      </form>
    </div>
  );
}
