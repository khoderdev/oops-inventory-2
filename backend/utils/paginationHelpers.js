export const parsePaginationParams = (query, options = {}) => {
  const { defaultLimit = 50, maxLimit = 1000, defaultSortBy = "id", allowedSortFields = ["id", "name", "createdAt", "updatedAt"] } = options;
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const offset = (page - 1) * limit;
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : defaultSortBy;
  const sortOrder = ["ASC", "DESC"].includes(query.sortOrder?.toUpperCase()) ? query.sortOrder.toUpperCase() : "ASC";
  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder
  };
};

export const buildPaginationResponse = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems: totalCount,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, totalCount)
  };
};

export const buildFilterConditions = (query, filterConfig = {}, Op) => {
  const whereClause = {};
  if (query.search && filterConfig.searchFields) {
    const searchConditions = filterConfig.searchFields.map(field => ({
      [field]: { [Op.iLike]: `%${query.search}%` }
    }));
    whereClause[Op.or] = searchConditions;
  }
  if (filterConfig.exactFilters) {
    filterConfig.exactFilters.forEach(field => {
      if (query[field]) {
        whereClause[field] = query[field];
      }
    });
  }
  if (filterConfig.rangeFilters) {
    filterConfig.rangeFilters.forEach(field => {
      if (query[`${field}_from`]) {
        whereClause[field] = { ...whereClause[field], [Op.gte]: query[`${field}_from`] };
      }
      if (query[`${field}_to`]) {
        whereClause[field] = { ...whereClause[field], [Op.lte]: query[`${field}_to`] };
      }
    });
  }
  return whereClause;
};

export const parseFieldSelection = (fieldsParam, allowedFields) => {
  if (!fieldsParam) return undefined;

  const requestedFields = fieldsParam.split(",").map(f => f.trim());
  const validFields = requestedFields.filter(field => allowedFields.includes(field));

  return validFields.length > 0 ? validFields : undefined;
};
