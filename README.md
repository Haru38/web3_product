# web3_product
web3関連の開発物

## BatchTransferFromSS.js
opensea-js APIを用いて既にミントされているNFTであれば一括で複数人に配布することができる。
openseaからだと、一つ一つtransferのページに移動しないといけないためこのコードによってその手間が省ける。
しかしながら、openseaはmintの時点でブロックチェーン上に所有者の情報は書き込まれていないため、
このコードが実際に効力を持つのはNFTがtransfer(sold)されてから。

## GassAutoSend.js
Matic(ether)を複数人に対して一括で同じ額配布するコード。
あらかじめスプレッドーシートに送付先のwallet Addressを入れておく。
それらはgoogle form等で自動で集めておけばなお効率がいい。

