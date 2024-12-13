export default function ResultGrid({ results }) {
    if (!results?.length) return null;
  
    return (
      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold">Generated Photos</h2>
        <div className="grid grid-cols-2 gap-4">
          {results.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Generated ${index + 1}`}
              className="w-full aspect-[3/4] object-cover rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }
  