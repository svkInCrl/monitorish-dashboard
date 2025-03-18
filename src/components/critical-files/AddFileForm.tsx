
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AddFileFormProps {
  onSuccess: () => void;
}

interface FormData {
  path: string;
}

export function AddFileForm({ onSuccess }: AddFileFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      path: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/critical-files/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to add file");
      }

      await queryClient.invalidateQueries({ queryKey: ["criticalFiles"] });
      toast({
        title: "Success",
        description: "File added to monitoring.",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add file to monitoring.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File Path</FormLabel>
              <FormControl>
                <Input placeholder="/path/to/file" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Add File
        </Button>
      </form>
    </Form>
  );
}
