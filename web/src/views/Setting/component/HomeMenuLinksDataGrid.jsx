import PropTypes from 'prop-types';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { GridRowModes, DataGrid, GridToolbarContainer, GridActionsCellItem } from '@mui/x-data-grid';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { showError } from 'utils/common';

function randomId() {
  return Math.random().toString(36).substr(2, 9);
}

function normalizeRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const hasHome = safeRows.some((r) => r?.id === 'home' || r?.href === '/');
  const normalized = safeRows.map((r, index) => ({
    id: r?.id || randomId(),
    name: r?.name ?? '',
    href: r?.href ?? '',
    show: r?.show ?? true,
    sort: typeof r?.sort === 'number' ? r.sort : index
  }));

  if (!hasHome) {
    normalized.unshift({ id: 'home', name: '首页', href: '/', show: true, sort: -1 });
  }

  // 强制首页不可隐藏、不可改链接
  return normalized.map((r, index) => {
    if (r.id === 'home' || r.href === '/') {
      return { ...r, id: 'home', name: r.name || '首页', href: '/', show: true, sort: index };
    }
    return { ...r, sort: index };
  });
}

function validation(row) {
  if (!row.name || row.name.trim() === '') return '名称不能为空';
  if (!row.href || row.href.trim() === '') return '链接不能为空';
  // 允许内部路径或 http(s) 外链
  if (!row.href.startsWith('/') && !/^https?:\/\//i.test(row.href)) return '链接必须以 / 或 http(s):// 开头';
  return false;
}

function EditToolbar({ setRows, setRowModesModel }) {
  const handleClick = () => {
    const id = randomId();
    setRows((oldRows) => [{ id, name: '', href: '', show: true, sort: 0, isNew: true }, ...oldRows]);
    setRowModesModel((oldModel) => ({
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
      ...oldModel
    }));
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        新增
      </Button>
    </GridToolbarContainer>
  );
}

EditToolbar.propTypes = {
  setRows: PropTypes.func.isRequired,
  setRowModesModel: PropTypes.func.isRequired
};

const HomeMenuLinksDataGrid = ({ links, onChange }) => {
  const [rows, setRows] = useState([]);
  const [rowModesModel, setRowModesModel] = useState({});

  const setLinks = useCallback(
    (linksRow) => {
      const linksJson = [];
      linksRow.forEach((row) => {
        // eslint-disable-next-line no-unused-vars
        const { isNew, ...rest } = row;
        linksJson.push(rest);
      });
      onChange({ target: { name: 'HomeMenuLinks', value: JSON.stringify(normalizeRows(linksJson), null, 2) } });
    },
    [onChange]
  );

  const moveRow = useCallback(
    (id, dir) => () => {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return;
      const target = idx + dir;
      if (target < 0 || target >= rows.length) return;
      const next = [...rows];
      const tmp = next[idx];
      next[idx] = next[target];
      next[target] = tmp;
      setLinks(next);
    },
    [rows, setLinks]
  );

  const handleEditClick = useCallback(
    (id) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    },
    [rowModesModel]
  );

  const handleSaveClick = useCallback(
    (id) => () => {
      setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    },
    [rowModesModel]
  );

  const handleDeleteClick = useCallback(
    (id) => () => {
      const row = rows.find((r) => r.id === id);
      if (row?.id === 'home' || row?.href === '/') {
        showError('首页不能删除');
        return;
      }
      setLinks(rows.filter((r) => r.id !== id));
    },
    [rows, setLinks]
  );

  const handleCancelClick = useCallback(
    (id) => () => {
      setRowModesModel({
        ...rowModesModel,
        [id]: { mode: GridRowModes.View, ignoreModifications: true }
      });

      const editedRow = rows.find((row) => row.id === id);
      if (editedRow?.isNew) {
        setRows(rows.filter((row) => row.id !== id));
      }
    },
    [rowModesModel, rows]
  );

  const processRowUpdate = (newRow, oldRow) => {
    if (
      !newRow.isNew &&
      newRow.name === oldRow.name &&
      newRow.href === oldRow.href &&
      newRow.show === oldRow.show
    ) {
      return oldRow;
    }

    const updatedRow = { ...newRow, isNew: false };
    if (updatedRow.id === 'home' || updatedRow.href === '/') {
      updatedRow.id = 'home';
      updatedRow.href = '/';
      updatedRow.show = true;
      updatedRow.name = updatedRow.name || '首页';
    }

    const error = validation(updatedRow);
    if (error) {
      return Promise.reject(new Error(error));
    }

    setLinks(rows.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleProcessRowUpdateError = useCallback((error) => {
    showError(error.message);
  }, []);

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const columns = useMemo(
    () => [
      {
        field: 'name',
        sortable: true,
        headerName: '名称',
        flex: 1,
        minWidth: 180,
        editable: true,
        hideable: false
      },
      {
        field: 'href',
        sortable: false,
        headerName: '链接',
        flex: 1,
        minWidth: 260,
        editable: true,
        hideable: false
      },
      {
        field: 'show',
        sortable: false,
        headerName: '是否显示',
        flex: 0.6,
        minWidth: 120,
        type: 'boolean',
        editable: true,
        hideable: false
      },
      {
        field: 'order',
        type: 'actions',
        headerName: '顺序',
        width: 110,
        hideable: false,
        getActions: ({ id }) => [
          <GridActionsCellItem key={`Up-${id}`} icon={<ArrowUpwardIcon />} label="Up" onClick={moveRow(id, -1)} />,
          <GridActionsCellItem key={`Down-${id}`} icon={<ArrowDownwardIcon />} label="Down" onClick={moveRow(id, 1)} />
        ]
      },
      {
        field: 'actions',
        type: 'actions',
        headerName: '操作',
        width: 120,
        cellClassName: 'actions',
        hideable: false,
        getActions: ({ id }) => {
          const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<SaveIcon />}
                key={'Save-' + id}
                label="Save"
                sx={{ color: 'primary.main' }}
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                key={'Cancel-' + id}
                label="Cancel"
                className="textPrimary"
                onClick={handleCancelClick(id)}
                color="inherit"
              />
            ];
          }

          return [
            <GridActionsCellItem
              key={'Edit-' + id}
              icon={<EditIcon />}
              label="Edit"
              className="textPrimary"
              onClick={handleEditClick(id)}
              color="inherit"
            />,
            <GridActionsCellItem
              key={'Delete-' + id}
              icon={<DeleteIcon />}
              label="Delete"
              onClick={handleDeleteClick(id)}
              color="inherit"
            />
          ];
        }
      }
    ],
    [handleEditClick, handleSaveClick, handleDeleteClick, handleCancelClick, moveRow, rowModesModel]
  );

  useEffect(() => {
    try {
      const itemJson = normalizeRows(JSON.parse(links || '[]'));
      setRows(itemJson);
    } catch {
      setRows(
        normalizeRows([
          { id: 'home', name: '首页', href: '/', show: true },
          { id: 'playground', name: '聊天', href: '/playground', show: true },
          { id: 'price', name: '价格', href: '/price', show: true },
          { id: 'about', name: '关于', href: '/about', show: true }
        ])
      );
    }
  }, [links]);

  return (
    <Box
      sx={{
        width: '100%',
        '& .actions': { color: 'text.secondary' },
        '& .textPrimary': { color: 'text.primary' }
      }}
    >
      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        editMode="row"
        hideFooter
        disableRowSelectionOnClick
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
        isCellEditable={(params) => {
          const isHome = params.row?.id === 'home' || params.row?.href === '/';
          if (isHome && params.field === 'show') return false;
          if (isHome && params.field === 'href') return false;
          return true;
        }}
        slots={{ toolbar: EditToolbar }}
        slotProps={{ toolbar: { setRows, setRowModesModel } }}
      />
    </Box>
  );
};

HomeMenuLinksDataGrid.propTypes = {
  links: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default HomeMenuLinksDataGrid;

