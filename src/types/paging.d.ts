type TPaginationQuery = {
  pageIndex: number | 1;
  pageSize: number | 10;
  searchTerm?: string | "";
};

type TPaginationMeta = {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

type TPagination<T> = {
  items: T[];
  meta: TPaginationMeta;
};
