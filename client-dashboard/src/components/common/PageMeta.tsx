import { useEffect } from "react";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      created = true;
    }
    const prevContent = meta.content;
    meta.content = description;
    if (created) document.head.appendChild(meta);

    return () => {
      document.title = prevTitle;
      if (meta) meta.content = prevContent || "";
    };
  }, [title, description]);

  return null;
};

export const AppWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default PageMeta;
