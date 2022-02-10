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
const planoValor = getByColumnAndInterval('H', [2, 11])
  .map((value) => value.replace(',', '.'))
  .map((value) => +value)

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
const duracaoSegundosInt = duracaoSegundos.map((value) => +value)

// SEGUINDO_ARTISTA TABLE
const [artistaSegundoArtista, usuarioSeguindoArtista] = getInfosInARow(getByColumnAndInterval('K', [2, 11]));
const artistaSegundoArtistaIds = artistaSegundoArtista
  .map((value) => artista.findIndex((artista) => value === artista) + 1)

//  USUARIO_CANCAO TABLE
const [dataReproducao, usuarioIdCancao] = getInfosInARow(getByColumnAndInterval('E', [2, 11]));
const [cancoesUsuarioCancao] = getInfosInARow(getByColumnAndInterval('D', [2, 11]));
const cancoesId = cancoesUsuarioCancao
  .map((value) => cancao.findIndex((key) => key === value) + 1)

//  INSERT ITENS
const insertItens = async () => {
  console.log('Start insert')

  for (const [index, item] of plano.entries()) {
    const query = `INSERT INTO plano(plano, valor) VALUES (?, ?)`
    await connection.execute(query, [item, planoValor[index]])
  }
  console.log('finish insert into plano table')

  for (const [index, item] of usuario.entries()) {
    const query = `INSERT IGNORE INTO usuario(usuario, idade, plano_id, data_assinatura) VALUES (?, ?, ?, ?)`
    await connection.execute(query, [item, usuarioAge[index], planoId[index], dataAssinatura[index]])
  }
  console.log('finish insert into usuario table')

  for (const [_index, item] of artista.entries()) {
    const query = 'INSERT INTO artista(artista) VALUES (?)'
    await connection.execute(query, [item])
  }
  console.log('finish insert into artista table')

  for (const [index, item] of album.entries()) {
    const query = 'INSERT INTO album(album, artista_id, ano_lancamento) VALUES (?, ?, ?)'
    await connection.execute(query, [item, artistaAlbum[index], anoLancamento[index]])
  }
  console.log('finish insert into album table')

  for (const [index, item] of cancao.entries()) {
    const query = 'INSERT INTO cancao(cancao, album_id, duracao_segundos) VALUES (?, ?, ?)'
    await connection.execute(query, [item, albumCancao[index], duracaoSegundosInt[index]])
  }
  console.log('finish insert into cancao table')

  for (const [index, item] of artistaSegundoArtistaIds.entries()) {
    const query = 'INSERT IGNORE INTO seguindo_artistas(usuario_id, artista_id) VALUES (?, ?)'
    await connection.execute(query, [usuarioSeguindoArtista[index], item])
  }
  console.log('finish insert into seguindo_artistas table')

  for (const [index, item] of cancoesId.entries()) {
    const query = 'INSERT IGNORE INTO usuario_cancao(usuario_id, cancao_id, data_reproducao) VALUES (?, ?, ?)'
    await connection.execute(query, [usuarioIdCancao[index], item, dataReproducao[index]])
  }
  console.log('finish insert into usuario_cancao table')

  console.log('Insert completed');
  process.exit(0)
}
insertItens();
