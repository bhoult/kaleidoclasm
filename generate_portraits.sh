#!/bin/bash
# Generate 50 apocalyptic character portraits

DRAW_PY="/home/bhoult/programming/ai-scrape/draw.py"
OUTPUT_DIR="/home/bhoult/programming/kaleidoclasm/images/photos"

# Arrays of variations
genders=("male" "female")
ages=("young" "middle-aged" "elderly")
ethnicities=("caucasian" "african" "asian" "latino" "middle eastern" "south asian" "indigenous")
features=("scarred face" "dirt-covered" "wearing goggles" "with gas mask around neck" "with eye patch" "with bandaged head" "weathered skin" "radiation burns" "tribal face paint" "military beret" "hood and scarf" "bald head" "mohawk" "dreadlocks" "shaved sides")
backgrounds=("ruined city" "wasteland desert" "abandoned building interior" "smoky orange sky" "radioactive fog" "burnt forest" "flooded streets" "crumbling concrete" "rusty metal structures" "overgrown ruins")
styles=("photorealistic portrait" "cinematic headshot" "dramatic lighting portrait" "gritty realistic photo")

count=0
total=50

echo "Generating $total apocalyptic character portraits..."
echo "Output directory: $OUTPUT_DIR"

while [ $count -lt $total ]; do
    # Pick random elements
    gender=${genders[$((RANDOM % ${#genders[@]}))]}
    age=${ages[$((RANDOM % ${#ages[@]}))]}
    ethnicity=${ethnicities[$((RANDOM % ${#ethnicities[@]}))]}
    feature=${features[$((RANDOM % ${#features[@]}))]}
    background=${backgrounds[$((RANDOM % ${#backgrounds[@]}))]}
    style=${styles[$((RANDOM % ${#styles[@]}))]}

    # Build prompt
    prompt="$style of a $age $ethnicity $gender survivor, $feature, post-apocalyptic, $background background, intense expression, harsh lighting, detailed face, 4k quality"

    # Generate unique filename
    filename="survivor_$(printf '%03d' $count).jpg"
    output="$OUTPUT_DIR/$filename"

    echo ""
    echo "[$((count + 1))/$total] Generating: $filename"
    echo "Prompt: $prompt"

    # Generate image (512x512 for headshots, faster generation)
    "$DRAW_PY" "$prompt" --output "$output" --width 512 --height 512 --steps 6

    if [ $? -eq 0 ]; then
        echo "Saved: $output"
        count=$((count + 1))
    else
        echo "Failed to generate image, retrying..."
    fi
done

echo ""
echo "Generation complete! $count portraits saved to $OUTPUT_DIR"
