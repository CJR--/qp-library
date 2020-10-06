define(module, (exports, require) => {

  var qp = require('qp-utility');
  var crypto = require('crypto');

  qp.module(exports, {

    ns: 'qp-library/crytpo',

    create_key: function(length) {
      length = length || 256;
      return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
    },

    random: function(minimum, maximum) {
      var distance = maximum - minimum;
      var max_bytes = 6;
      var max_int = 281474976710656;

      if (distance < 256) {
        max_bytes = 1;
        max_int = 256;
      } else if (distance < 65536) {
        max_bytes = 2;
        max_int = 65536;
      } else if (distance < 16777216) {
        max_bytes = 3;
        max_int = 16777216;
      } else if (distance < 4294967296) {
        max_bytes = 4;
        max_int = 4294967296;
      } else if (distance < 1099511627776) {
        max_bytes = 4;
        max_int = 1099511627776;
      }

      var rnd_bytes = parseInt(crypto.randomBytes(max_bytes).toString('hex'), 16);
      var result = Math.floor(rnd_bytes / max_int * (maximum - minimum + 1) + minimum);

      if (result > maximum) result = maximum;
      return result;
    },

    create_password: function(length, segment) {
      var set0 = 'abcdfghjklmnpqrstwxyz';
      var set1 = 'ABCDFGHJKLMNPQRSTWXYZ';
      var set2 = '23456789';

      var rnd_set = qp.shuffle(
        qp.union(
          this.random_set(length - 3, set0 + set1 + set2),
          this.random_set(1, set0),
          this.random_set(1, set1),
          this.random_set(1, set2)
        )
      );

      if (qp.is(segment, 'number')) {
        return qp.map(qp.segment(rnd_set, segment), item => item.join('')).join('-');
      } else {
        return rnd_set.join('');
      }
    },

    create_code: function(length, segment) {
      var set = this.random_set(length, 'BCDFGHJKLMNPQRSTWXYZ23456789');
      if (qp.is(segment, 'number')) {
        return qp.map(qp.segment(set, segment), item => item.join('')).join('-');
      } else {
        return set.join('');
      }
    },

    sequence_id: function(next_id, sequence, segment) {
      var sequence_id = qp.map(qp.segment(Array.from(next_id), segment), item => item.join('')).join('-');
      var id = Array.from(next_id);
      var idx = sequence.length - 1, i = next_id.length - 1;
      while (idx == 27) {
        idx = sequence.indexOf(id[i]);
        id[i] = idx === 27 ? sequence[0] : sequence[idx + 1];
        i--;
      }
      return { id: sequence_id, next_id: id.join('') };
    },

    create_reference: function() {
      var o = this.random_set(12, 'BCDFGHJKLMNPQRSTWXYZ23456789');
      return `${o[0]}${o[1]}${o[2]}${o[3]}-${o[4]}${o[5]}${o[6]}${o[7]}-${o[8]}${o[9]}${o[10]}${o[11]}`;
    },

    random_set: function(length, set0) {
      set0 = set0 || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var set1 = [];
      var set0_length = set0.length;
      var random = crypto.randomBytes(length);
      for (var i = 0; i < length; i++) {
        set1[i] = set0[random[i] % set0_length];
      }
      return set1;
    },

    hash_sha256: function() {
      var s = qp.arg(arguments).join('');
      return crypto.createHash('sha256').update(s).digest('hex');
    },

    hash_MD5: function() {
      var s = qp.arg(arguments).join('');
      return crypto.createHash('MD5').update(s).digest('hex');
    },

    hash: function() { return this.hash_sha256.apply(this, arguments); },

    hmac_sha256: function(key, data) {
      var hmac = crypto.createHmac('sha256', key);
      return hmac.update(data).digest('hex');
    },

    hmac: function() { return this.hmac_sha256.apply(this, arguments); }

  });

});
