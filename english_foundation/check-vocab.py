import json

data = json.load(open('content/cambridge_curriculum.json'))
total = len(data['tracks']['vocab'])
b1_vocab = [v for v in data['tracks']['vocab'] if v.get('level') == 'B1']

print(f'Total vocab lessons: {total}')
print(f'B1 vocab lessons: {len(b1_vocab)}')
print('\nB1 lesson IDs:')
for v in b1_vocab:
    print(f"  {v['id']}: {v['title']}")
