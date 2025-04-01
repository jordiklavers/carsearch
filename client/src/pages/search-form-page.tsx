import { useParams } from "wouter";
import { SearchForm } from "@/components/search/search-form";

export default function SearchFormPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <SearchForm searchId={id} />
    </div>
  );
}
