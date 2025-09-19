// @ts-nocheck

${1:Class} // Addresses or Contacts 
${2:Type} // Address
${3:var1} // address
${4:var2} // addresses or contacts

import { useCallback, useEffect, useState } from 'react'
import { t } from 'i18next'
import createGrid, { GridPagination, GridSortData } from '@components/layouts/Grid'
import Surface from '@components/layouts/Surface'
import Tab from '@components/layouts/Tab'
import ActionButton from '@components/buttons/ActionButton'
import TextInput from '@components/inputs/TextInput'
import ${1} from 'nexus-pi-engine-client/dist/routers/'
import { ${2}Methods } from 'nexus-pi-engine-client/dist/routers/'

type ${2}GridProps = {
  parentId: number
  onSelected${2}: (${3}: ${1}.${2}) => void
  forceReload: boolean
  onAdd${2}?: () => void
  ${3}Methods: ${2}Methods
}

const { Grid, Column } = createGrid<${1}.${2}>()

const ${2}Grid: React.FC<${2}GridProps> = ({ parentId, forceReload, onSelected${2}, onAdd${2}, ${3}Methods }) => {
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(20)
  const [search, setSearch] = useState<string>('')
  const [totalItems, setTotalItems] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(0)

  const [${4}, set${1}] = useState<${1}.${2}[]>([])

  const [orderBy, setOrderBy] = useState<${1}.${1}OrderBy | undefined>(undefined)

  const reloadData = useCallback(async () => {
    const result = await ${3}Methods.getMany(parentId, {
      page,
      pageSize,
      search,
      orderBy,
      select: [
        'id',
        'name',
        'createdAt'
      ]
    })
    set${1}(result.data ?? [])
    setTotalItems(result.pagination?.totalItems ?? 0)
    setTotalPages(result.pagination?.totalPages ?? 0)
  }, [page, pageSize, search, forceReload, orderBy])

  useEffect(() => {
    reloadData()
  }, [reloadData])

  const handleSort${1} = (sort: GridSortData<${1}.${2}>) => {
    let newOrder: ${1}.${1}OrderBy | undefined = undefined
    if (sort.field === 'name' && sort.direction === 'asc') newOrder = ${1}.${1}OrderBy.NameAZ
    if (sort.field === 'name' && sort.direction === 'desc') newOrder = ${1}.${1}OrderBy.NameZA
    if (sort.field === 'createdAt' && sort.direction === 'asc') newOrder = ${1}.${1}OrderBy.CreatedAtFL
    if (sort.field === 'createdAt' && sort.direction === 'desc') newOrder = ${1}.${1}OrderBy.CreatedAtLF
    setOrderBy(newOrder)
  }

  return (
    <>
      <Tab.SubTitle title={t('Manage ${1}')}>
        <ActionButton label={t('Add ${2}')} icon="plus" onClick={onAdd${2}} btnSize="md" />
      </Tab.SubTitle>
      <Surface>
        <Surface.Header title={`${t('${1} on Party')}: ${parentId}`}>
          <TextInput placeHolder="search..." value={search} iconClass="search" onChange={setSearch} />
        </Surface.Header>
        <Surface.Body>
          <Grid data={${4} ?? []} onRowClick={onSelected${2}} onSortChange={handleSort${1}}>
            <Column field="name" label="Name" sortable width={200} />
            <Column field="createdAt" label="Created At" sortable />
          </Grid>
        </Surface.Body>
        <Surface.Footer>
          <GridPagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Surface.Footer>
      </Surface>
    </>
  )
}

export default ${2}Grid
