#!/bin/bash
# Generate 10 weak, desperate-looking enemy characters

DRAW_PY="/home/bhoult/programming/ai-scrape/draw.py"
OUTPUT_DIR="/home/bhoult/programming/kaleidoclasm/images/photos"

# Arrays of variations for weak enemies
types=("starving scavenger" "desperate survivor" "emaciated beggar" "sickly wanderer" "malnourished refugee" "weakened looter" "frail drifter" "diseased vagrant" "exhausted straggler" "dying outcast")
genders=("male" "female")
features=("sunken eyes" "visible ribs" "hollow cheeks" "pale sickly skin" "shaking hands" "gaunt face" "protruding bones" "cracked lips" "dark circles under eyes" "hunched posture")
clothing=("torn rags" "filthy oversized clothes" "threadbare shirt" "ragged blanket as cloak" "dirty bandages" "tattered hoodie" "stained worn-out clothes")
weapons=("rusty kitchen knife" "broken bottle" "sharp stick" "rock" "bent pipe" "no weapon, just desperate hands")
poses=("cowering" "stumbling forward" "reaching out desperately" "hunched over" "weakly threatening" "barely standing" "on knees begging")
backgrounds=("desolate wasteland" "garbage pile" "abandoned alley" "ruined shelter" "muddy road" "grey overcast sky")

count=0
total=10

echo "Generating $total weak/desperate enemy characters..."
echo "Output directory: $OUTPUT_DIR"

while [ $count -lt $total ]; do
    # Pick random elements
    type=${types[$((RANDOM % ${#types[@]}))]}
    gender=${genders[$((RANDOM % ${#genders[@]}))]}
    feature=${features[$((RANDOM % ${#features[@]}))]}
    clothes=${clothing[$((RANDOM % ${#clothing[@]}))]}
    weapon=${weapons[$((RANDOM % ${#weapons[@]}))]}
    pose=${poses[$((RANDOM % ${#poses[@]}))]}
    background=${backgrounds[$((RANDOM % ${#backgrounds[@]}))]}

    # Build prompt
    prompt="full body shot of a $type $gender, extremely thin and malnourished, $feature, wearing $clothes, holding $weapon, $pose, post-apocalyptic, $background background, pitiful, weak, desperate, starving, gritty, cinematic lighting, detailed, 4k quality, concept art style"

    # Generate unique filename
    filename="enemy_weak_$(printf '%03d' $count).jpg"
    output="$OUTPUT_DIR/$filename"

    echo ""
    echo "[$((count + 1))/$total] Generating: $filename"
    echo "Prompt: $prompt"

    # Generate image (512x768 for full body portrait orientation)
    "$DRAW_PY" "$prompt" --output "$output" --width 512 --height 768 --steps 6

    if [ $? -eq 0 ]; then
        echo "Saved: $output"
        count=$((count + 1))
    else
        echo "Failed to generate image, retrying..."
    fi
done

echo ""
echo "Generation complete! $count weak enemy characters saved to $OUTPUT_DIR"
