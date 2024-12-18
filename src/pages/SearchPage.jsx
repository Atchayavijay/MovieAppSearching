import { useState, useEffect, useRef, useCallback } from "react";
import { fetchMovies } from "../api/Services";
import { useNavigate, useLocation } from "react-router-dom";
import MovieCard from "../components/MovieCard";

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve state from location (to preserve search state when returning from MovieDetailPage)

  const initialSearchTerm = location.state?.searchTerm || "";

  // Reset to empty on refresh

  const initialPage = location.state?.page || 1;
  const initialType = location.state?.type || "";

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState("");
  const [type, setType] = useState(initialType);
  const [loading, setLoading] = useState(false);

 

  const observer = useRef();

  useEffect(() => {

    if (!initialSearchTerm) {
      setMovies([]);
      setTotalResults(0);
      setPage(1);
      setError("");
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    if (searchTerm) {
      searchMovies(page);
    }
  }, [searchTerm, page, type]);

  const searchMovies = async (page) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMovies(searchTerm, page, type);
      setMovies((prevMovies) =>
        page === 1 ? data.Search : [...prevMovies, ...data.Search]
      );
      setTotalResults(parseInt(data.totalResults, 10));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    // Clear movies when starting a new search

    setMovies([]);
    setPage(1);
    searchMovies(1);
  };

  const handleFilterChange = (e) => {
    setType(e.target.value);

    // Reset to the first page when changing filter

    setPage(1);
    setMovies([]);
  };

  const lastMovieElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && movies.length < totalResults) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, totalResults, movies.length]
  );

  // Navigate to MovieDetailPage and pass search state

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`, {
      state: {
        searchTerm,
        page,
        type,
      },
    });
  };

  return (
    <div className="mx-auto p-4 container">
      <form
        onSubmit={handleSearch}
        className="flex justify-center mb-4 font-poppins"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for movies..."
          className="border-2 border-gray-300 p-2 hover:border-black rounded-l-md w-full max-w-md outline-none"
        />
        <button
          type="submit"
          className="bg-black px-4 rounded-r-md hover:font-bold text-white"
        >
          Search
        </button>
      </form>

      <div className="mb-4">
        <select
          onChange={handleFilterChange}
          value={type}
          className="border-2 border-gray-300 p-2 hover:border-black rounded-lg font-bold font-poppins cursor-pointer outline-none"
        >
          <option value="">All</option>
          <option value="movie">Movies</option>
          <option value="series">Series</option>
          <option value="episode">Episodes</option>
        </select>
      </div>

      {error && (
        <p className="pb-10 font-bold font-poppins text-center text-red-500">
          {error}
        </p>
      )}
      {!error && movies.length === 0 && !loading && (
        <p className="pb-10 font-bold font-poppins text-center text-red-500">
          No results found.
        </p>
      )}

      <div className="gap-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
        {movies.map((movie, index) => {
          if (movies.length === index + 1) {
            return (
              <div ref={lastMovieElementRef} key={movie.imdbID}>
                <MovieCard
                  movie={movie}
                  onClick={() => handleMovieClick(movie.imdbID)}
                />
              </div>
            );
          } else {
            return (
              <MovieCard
                key={movie.imdbID}
                movie={movie}
                onClick={() => handleMovieClick(movie.imdbID)}
              />
            );
          }
        })}
      </div>

      {loading && (
        <p className="mt-4 font-poppins text-blue-500 text-center">
          Loading more movies...
        </p>
      )}
    </div>
  );
};

export default SearchPage;
