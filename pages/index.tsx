import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState("anime");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please upload a file.");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("style", style);

    setStatus("Uploading...");
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setStatus("Uploaded successfully!");
    } else {
      setStatus("Upload failed.");
    }
  };

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Create Your Trend AI Portrait
      </h1>
      <form onSubmit={handleSubmit}>
        <label>
          Upload your image:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>

        <div style={{ marginTop: "1rem" }}>
          <p>Select a style:</p>
          <label>
            <input
              type="radio"
              name="style"
              value="anime"
              checked={style === "anime"}
              onChange={(e) => setStyle(e.target.value)}
            />
            Anime
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="style"
              value="pixar"
              checked={style === "pixar"}
              onChange={(e) => setStyle(e.target.value)}
            />
            Pixar
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="style"
              value="cyberpunk"
              checked={style === "cyberpunk"}
              onChange={(e) => setStyle(e.target.value)}
            />
            Cyberpunk
          </label>
        </div>

        <button type="submit" style={{ marginTop: "1rem" }}>
          Submit
        </button>
      </form>

      <p>{status}</p>
    </main>
  );
}
