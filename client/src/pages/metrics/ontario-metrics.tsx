function OntarioMetricsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ontario Metrics</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <iframe
          width="100%"
          height="600"
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTFBbDbDXphC27IvqHY1OoJNFE7i_J2mP6eoLeXaAHFZmfuaUOTvb5PdypNNwaCatmDUrNTvG4CZMKv/pubchart?oid=525167611&format=interactive"
          frameBorder="0"
          allowFullScreen
          className="w-full"
        />
      </div>
    </div>
  );
}