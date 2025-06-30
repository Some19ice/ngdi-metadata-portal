"use client"

import SearchPageSearchBar, {
  SearchPageSearchBarProps
} from "./search-page-search-bar"

export default function SearchPageSearchBarWrapper(
  props: SearchPageSearchBarProps
) {
  return <SearchPageSearchBar {...props} />
}
