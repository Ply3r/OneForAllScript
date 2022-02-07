const XLSX = require('xlsx');
const connection = require('./models/connection.js');

//  CONSTANST
const { Sheets: { Sheet1: Sheets } } = XLSX.readFile('./SpotifyClone.xlsx')

//  FUNCTIONS
const filterByColumn = (key, column, space) => {
  const [start, end] = space;
  const letter = new RegExp(column, 'i');
  const number = key.match(/[\d]+$/);

  if (!number) return false;
  const numberInt = +number[0]

  return letter.test(key) && (numberInt >= start && numberInt <= end);
}

const getByColumnAndInterval = (column, space) => {
  const data = Object.entries(Sheets)
    .filter(([key]) => filterByColumn(key, column, space))
    .map(([_key, { v }]) => v);
  return data
}

const getUniqueArray = (array) => {
  const hold = array
    .filter((value, index, arr) => arr.indexOf(value) === index);
  return hold;
}

const getInfosInARow = (array) => {
  const hold = [];
  const times = [];
  array.forEach((value, index) => {
    const arrayInfos = value.split(';')
    const infos = arrayInfos.map((info) => info.replace(/["]+/gmi, '').trim())

    infos.forEach(() => times.push(index + 1))
    hold.push(...infos)
  })
  return [hold, times];
}

//  ARRAYS MULTIUSO
const planos = getByColumnAndInterval('F', [2, 11]);
const artistas = getByColumnAndInterval('C', [14, 23]);
const cancoes = getByColumnAndInterval('D', [14, 23]);


//  PLANO TABLE
const plano = getUniqueArray([...planos]);
const planoValor = getByColumnAndInterval('H', [2, 11]).map((value) => parseFloat(value))

//  USUARIO TABLE
const usuario = getByColumnAndInterval('B', [2, 11]);
const usuarioAge = getByColumnAndInterval('C', [2, 11]);
const planoId = planos.map((value) => plano.findIndex((plano) => plano === value) + 1)
const dataAssinatura = getByColumnAndInterval('G', [2, 11]);

//  ARTISTA TABLE
const artista = getUniqueArray([...artistas]);

//  ALBUM TABLE
const album = getByColumnAndInterval('B', [14, 23]);
const artistaAlbum = artistas.map((value) => artista.findIndex((artista) => artista === value) + 1);
const anoLancamento = getByColumnAndInterval('F', [14, 23]);


//  CANÇÃO TABLE
const [cancao] = getInfosInARow(cancoes);
const [duracaoSegundos, albumCancao] = getInfosInARow(getByColumnAndInterval('E', [14, 23]));

// SEGUINDO_ARTISTA TABLE
const [artistaSegundoArtista, usuarioSeguindoArtista] = getInfosInARow(getByColumnAndInterval('K', [2, 11]));
const artistaSegundoArtistaIds = artistaSegundoArtista
  .map((value) => artista.findIndex((artista) => value === artista) + 1)
  .filter(Boolean)

//  USUARIO_CANCAO TABLE
const [dataReproducao, usuarioIdCancao] = getInfosInARow(getByColumnAndInterval('E', [2, 11]));
const [cancoesUsuarioCancao] = getInfosInARow(getByColumnAndInterval('D', [2, 11]));
const cancoesId = cancoesUsuarioCancao
  .map((value) => cancao.findIndex((key) => key === value) + 1)

//  INSERT ITENS
const insertItens = async () => {
  await Promise.all(plano.map(async (plano, index) => {
    const query = `INSERT INTO plano(plano, valor) VALUES (?, ?)`
    await connection.execute(query, [plano, planoValor[index]])
  }));
  await Promise.all(usuario.map(async (usuario, index) => {
    const query = `INSERT IGNORE INTO usuario(usuario, idade, plano_id, data_assinatura) VALUES (?, ?, ?, ?)`
    await connection.execute(query, [usuario, usuarioAge[index], planoId[index], dataAssinatura[index]])
  }));
  await Promise.all(artista.map(async (artista) => {
    const query = 'INSERT INTO artista(artista) VALUES (?)'
    await connection.execute(query, [artista])
  }));
  await Promise.all(album.map(async (album, index) => {
    const query = 'INSERT INTO album(album, artista_id, ano_lancamento) VALUES (?, ?, ?)'
    await connection.execute(query, [album, artistaAlbum[index], anoLancamento[index]])
  }));
  await Promise.all(cancao.map(async (cancao, index) => {
    const query = 'INSERT INTO cancao(cancao, album_id, duracao_segundos) VALUES (?, ?, ?)'
    await connection.execute(query, [cancao, albumCancao[index], duracaoSegundos[index]])
  }));
  await Promise.all(artistaSegundoArtistaIds.map(async (artista, index) => {
    const query = 'INSERT IGNORE INTO seguindo_artistas(usuario_id, artista_id) VALUES (?, ?)'
    await connection.execute(query, [usuarioSeguindoArtista[index], artista])
  }));
  await Promise.all(cancoesId.map(async (cancao, index) => {
    const query = 'INSERT IGNORE INTO usuario_cancao(usuario_id, cancao_id, data_reproducao) VALUES (?, ?, ?)'
    await connection.execute(query, [usuarioIdCancao[index], cancao, dataReproducao[index]])
  }));
  console.log('Insert completed');
}
insertItens();
