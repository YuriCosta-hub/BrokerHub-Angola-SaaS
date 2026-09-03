import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { apiJson } from "@/lib/session";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type DocumentRow = {
  id: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
};

export default function Documents() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const list = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiJson<DocumentRow[]>("/api/documents"),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Leitura falhou"));
        reader.readAsDataURL(file);
      });
      return apiJson("/api/documents", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          contentBase64,
          clientId: clientId || undefined,
        }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Documento guardado" });
    },
    onError: (err: Error) =>
      toast({ variant: "destructive", title: err.message }),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("file");
    const file =
      input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!file) return;
    upload.mutate(file);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">{t.nav.documents}</h2>
      <Card>
        <CardHeader>
          <CardTitle>Carregar</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="clientId">ID do cliente (opcional)</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file">Ficheiro</Label>
              <Input id="file" name="file" type="file" required />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={upload.isPending}>
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {(list.data ?? []).map((doc) => (
          <a
            key={doc.id}
            className="block rounded-md border p-3 text-sm hover:bg-muted"
            href={`/api/documents/${doc.id}/file`}
          >
            {doc.fileName} · {doc.sizeBytes} bytes
          </a>
        ))}
      </div>
    </div>
  );
}
